package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui

import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.StationCacheRepository
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardUiFormatter
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationLocalRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.QrTokenDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationStatus
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.util.ReservationTimeHelper
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.zxing.BarcodeFormat
import com.journeyapps.barcodescanner.BarcodeEncoder
import java.util.Date

/**
 * Member 2 activity for generating and displaying cryptographic QR credentials for approved reservations.
 *
 * Security and lifecycle guarantees:
 * - Requires BOTH local cached reservation AND backend MongoDB reservation to be in [ReservationStatus.APPROVED] state.
 * - Encodes strictly the raw server-issued [QrTokenDto.qrToken] in the QR barcode bitmap (no wrappers or metadata).
 * - QR token is kept strictly in-memory only in this activity: never written to SQLite, SharedPreferences, or Intent extras.
 * - Never logs or prints the raw cryptographic token to Logcat.
 * - Enforces the authoritative 4-hour post-slot expiry window (ReservationDateTime + 4 hours): if expired, hides refresh.
 * - When refreshed during an active window, the new token supersedes prior tokens; on network failure, active QR is preserved.
 * - Protects against duplicate network requests during onResume when an in-memory token is already active.
 */
class QrDispatchActivity : BaseActivity() {

    companion object {
        const val EXTRA_RESERVATION_ID = "extra_reservation_id"
        const val EXTRA_PROSUMER_NIC = "extra_prosumer_nic"
        private const val FOUR_HOURS_MILLIS: Long = 4L * 60L * 60L * 1000L
    }

    private lateinit var sessionManager: SessionManager
    private lateinit var localRepository: ReservationLocalRepository
    private lateinit var reservationRepository: ReservationRepository

    private lateinit var tvStatusBadge: TextView
    private lateinit var tvReservationId: TextView
    private lateinit var tvStation: TextView
    private lateinit var tvStationName: TextView
    private lateinit var tvDateTime: TextView
    private lateinit var tvSlot: TextView
    private lateinit var tvProsumer: TextView

    private lateinit var ivQrCode: ImageView
    private lateinit var progressQr: ProgressBar
    private lateinit var tvInstructions: TextView
    private lateinit var tvIssuedAt: TextView
    private lateinit var tvExpiresAt: TextView
    private lateinit var tvError: TextView
    private lateinit var btnRefreshQr: MaterialButton
    private lateinit var btnDone: MaterialButton

    private var reservationId: String = ""
    private var currentReservation: ReservationDto? = null
    private var currentQrTokenDto: QrTokenDto? = null
    private var isLoading: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_member2_qr_dispatch)

        val root = findViewById<View>(R.id.qrDispatchRoot)
        if (root != null) {
            setupSystemBarPadding(root)
        }

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarQrDispatch)
        toolbar?.setNavigationOnClickListener {
            finish()
        }

        sessionManager = SessionManager(this)
        localRepository = ReservationLocalRepository.getInstance(this)
        reservationRepository = ReservationRepository.getInstance()

        initViews()
        setupListeners()

        reservationId = intent.getStringExtra(EXTRA_RESERVATION_ID)?.trim().orEmpty()
        if (reservationId.isEmpty()) {
            Toast.makeText(this, R.string.error_reservation_not_found, Toast.LENGTH_SHORT).show()
            finish()
            return
        }
    }

    override fun onResume() {
        super.onResume()
        loadReservationAndVerifyEligibility()
    }

    private fun initViews() {
        tvStatusBadge = findViewById(R.id.tvQrStatusBadge)
        tvReservationId = findViewById(R.id.tvQrReservationId)
        tvStation = findViewById(R.id.tvQrStation)
        tvStationName = findViewById(R.id.tvQrStationName)
        tvDateTime = findViewById(R.id.tvQrDateTime)
        tvSlot = findViewById(R.id.tvQrSlot)
        tvProsumer = findViewById(R.id.tvQrProsumer)

        ivQrCode = findViewById(R.id.ivQrCode)
        progressQr = findViewById(R.id.progressQr)
        tvInstructions = findViewById(R.id.tvQrInstructions)
        tvIssuedAt = findViewById(R.id.tvQrIssuedAt)
        tvExpiresAt = findViewById(R.id.tvQrExpiresAt)
        tvError = findViewById(R.id.tvQrError)
        btnRefreshQr = findViewById(R.id.btnRefreshQr)
        btnDone = findViewById(R.id.btnQrDone)
    }

    private fun setupListeners() {
        btnRefreshQr.setOnClickListener {
            val record = currentReservation
            if (record != null && isReservationSlotWindowExpired(record)) {
                showExpiredState(record)
                return@setOnClickListener
            }
            fetchQrToken()
        }

        btnDone.setOnClickListener {
            finish()
        }
    }

    /**
     * Loads the target reservation from local persistence and validates approval eligibility
     * and prosumer session authorization before requesting server token generation.
     */
    private fun loadReservationAndVerifyEligibility() {
        AppExecutors.executeInBackground {
            val record = localRepository.getById(reservationId)

            AppExecutors.executeOnMainThread {
                if (record == null) {
                    Toast.makeText(this@QrDispatchActivity, R.string.error_reservation_not_found, Toast.LENGTH_SHORT).show()
                    finish()
                    return@executeOnMainThread
                }

                // Security scoping check against session
                val expectedNic = intent.getStringExtra(EXTRA_PROSUMER_NIC)?.trim()
                    ?: sessionManager.getUserIdentifier()?.trim()

                if (!expectedNic.isNullOrBlank() && !record.prosumerNic.equals(expectedNic, ignoreCase = true)) {
                    Toast.makeText(this@QrDispatchActivity, R.string.error_reservation_unauthorized, Toast.LENGTH_SHORT).show()
                    finish()
                    return@executeOnMainThread
                }

                currentReservation = record
                bindReservationHeader(record)

                // 1. Safety check: QR generation is strictly restricted to Approved reservations
                if (!record.status.equals("Approved", ignoreCase = true)) {
                    showNotApprovedState(record)
                    return@executeOnMainThread
                }

                // 2. Check if the 4-hour post-slot dispatch window has already permanently expired
                if (isReservationSlotWindowExpired(record)) {
                    showExpiredState(record)
                    return@executeOnMainThread
                }

                // 3. Prevent duplicate server requests on ordinary onResume cycles if active in-memory token exists
                val existingToken = currentQrTokenDto
                if (existingToken != null) {
                    val expiryInstant = ReservationTimeHelper.parseUtcInstant(existingToken.expiresAt)
                    if (expiryInstant != null && System.currentTimeMillis() >= expiryInstant.time) {
                        showExpiredState(record)
                    } else {
                        displayTokenDetails(existingToken)
                    }
                    return@executeOnMainThread
                }

                // 4. Request initial token from server
                fetchQrToken()
            }
        }
    }

    private fun bindReservationHeader(record: ReservationDto) {
        tvReservationId.text = getString(R.string.detail_id, record.id)
        tvStation.text = getString(R.string.detail_station, record.stationId)
        tvSlot.text = getString(R.string.detail_slot, record.slotId)
        tvProsumer.text = getString(R.string.detail_prosumer, record.prosumerNic)
        tvDateTime.text = getString(R.string.detail_datetime, DashboardUiFormatter.formatDateTime(record.reservationDateTime))

        if (record.stationId.isNotBlank()) {
            StationCacheRepository(this).getStationName(record.stationId) { name ->
                tvStationName.text = if (name.isNullOrBlank()) {
                    getString(R.string.detail_station_name_unknown)
                } else {
                    getString(R.string.detail_station_name, name)
                }
            }
        } else {
            tvStationName.text = getString(R.string.detail_station_name_unknown)
        }
    }

    /**
     * Checks whether the 4-hour post-slot dispatch window (ReservationDateTime + 4 hours) has permanently expired.
     */
    private fun isReservationSlotWindowExpired(record: ReservationDto): Boolean {
        val slotInstant = ReservationTimeHelper.parseUtcInstant(record.reservationDateTime) ?: return false
        val windowEndMillis = slotInstant.time + FOUR_HOURS_MILLIS
        return System.currentTimeMillis() >= windowEndMillis
    }

    /**
     * Displays a safe non-approved view and prevents QR endpoint invocation when status is Pending/Cancelled/Completed.
     */
    private fun showNotApprovedState(record: ReservationDto) {
        tvStatusBadge.text = getString(R.string.msg_qr_not_approved, record.status)
        tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_pending))
        tvStatusBadge.visibility = View.VISIBLE

        ivQrCode.visibility = View.INVISIBLE
        progressQr.visibility = View.GONE
        tvInstructions.text = getString(R.string.msg_qr_pending_notice)
        tvIssuedAt.visibility = View.GONE
        tvExpiresAt.visibility = View.GONE
        btnRefreshQr.visibility = View.GONE
        tvError.visibility = View.GONE
    }

    /**
     * Displays the permanent expired state: hides QR bitmap and disables/hides refresh button
     * since refreshing cannot restore validity after the 4-hour window has lapsed.
     */
    private fun showExpiredState(record: ReservationDto) {
        tvStatusBadge.text = getString(R.string.qr_status_expired)
        tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_cancelled))
        tvStatusBadge.visibility = View.VISIBLE

        ivQrCode.visibility = View.INVISIBLE
        progressQr.visibility = View.GONE
        tvInstructions.text = getString(R.string.msg_qr_token_expired)

        val slotInstant = ReservationTimeHelper.parseUtcInstant(record.reservationDateTime)
        if (slotInstant != null) {
            val expiryDate = Date(slotInstant.time + FOUR_HOURS_MILLIS)
            tvExpiresAt.text = getString(R.string.qr_expires_at, DashboardUiFormatter.formatDateTime(ReservationTimeHelper.toIsoUtcString(expiryDate)))
            tvExpiresAt.visibility = View.VISIBLE
        } else {
            tvExpiresAt.visibility = View.GONE
        }

        tvIssuedAt.visibility = View.GONE
        btnRefreshQr.visibility = View.GONE
        tvError.visibility = View.GONE
    }

    /**
     * Invokes POST /api/reservations/{id}/qr-token via [ReservationRepository] to acquire
     * a fresh cryptographic credential.
     */
    private fun fetchQrToken() {
        if (isLoading) return
        isLoading = true

        progressQr.visibility = View.VISIBLE
        // Keep existing QR bitmap visible if refreshing, so failed refresh does not blank a valid screen
        if (currentQrTokenDto == null) {
            ivQrCode.visibility = View.INVISIBLE
        }
        btnRefreshQr.isEnabled = false
        tvError.visibility = View.GONE

        reservationRepository.generateQrToken(
            id = reservationId,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<QrTokenDto> {
                override fun onSuccess(result: NetworkResult.Success<QrTokenDto>) {
                    isLoading = false
                    progressQr.visibility = View.GONE
                    btnRefreshQr.isEnabled = true

                    val dto = result.responseBody

                    // Check if newly returned token's expiry has already passed
                    val expiryInstant = ReservationTimeHelper.parseUtcInstant(dto.expiresAt)
                    val nowMillis = System.currentTimeMillis()
                    if (expiryInstant != null && nowMillis >= expiryInstant.time) {
                        currentQrTokenDto = null
                        currentReservation?.let { showExpiredState(it) }
                        return
                    }

                    // Active token received: replaces in-memory state only (no SQLite write)
                    currentQrTokenDto = dto
                    renderQr(dto.qrToken)
                    displayTokenDetails(dto)
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    isLoading = false
                    progressQr.visibility = View.GONE
                    btnRefreshQr.isEnabled = true

                    val message = ReservationRepository.extractErrorMessage(error)
                    tvError.text = message
                    tvError.visibility = View.VISIBLE

                    // If we already had an active token in memory, ensure it remains visible
                    val existingToken = currentQrTokenDto
                    if (existingToken != null) {
                        displayTokenDetails(existingToken)
                    }
                }
            }
        )
    }

    /**
     * Renders strictly the raw [qrToken] into a 512x512 QR code bitmap using ZXing.
     * Never logs, prints, or exposes the raw token.
     */
    private fun renderQr(qrToken: String) {
        if (qrToken.isBlank()) {
            ivQrCode.visibility = View.INVISIBLE
            tvError.text = getString(R.string.error_qr_render_failed)
            tvError.visibility = View.VISIBLE
            return
        }

        try {
            val barcodeEncoder = BarcodeEncoder()
            val bitmap = barcodeEncoder.encodeBitmap(qrToken, BarcodeFormat.QR_CODE, 512, 512)
            ivQrCode.setImageBitmap(bitmap)
            ivQrCode.visibility = View.VISIBLE
        } catch (_: Exception) {
            ivQrCode.visibility = View.INVISIBLE
            tvError.text = getString(R.string.error_qr_render_failed)
            tvError.visibility = View.VISIBLE
        }
    }

    /**
     * Displays token issuance, formatted expiry, and active status badge.
     */
    private fun displayTokenDetails(dto: QrTokenDto) {
        tvIssuedAt.text = getString(R.string.qr_issued_at, DashboardUiFormatter.formatDateTime(dto.issuedAt))
        tvIssuedAt.visibility = View.VISIBLE

        tvExpiresAt.text = getString(R.string.qr_expires_at, DashboardUiFormatter.formatDateTime(dto.expiresAt))
        tvExpiresAt.visibility = View.VISIBLE

        val expiryInstant = ReservationTimeHelper.parseUtcInstant(dto.expiresAt)
        val nowMillis = System.currentTimeMillis()
        val isExpired = expiryInstant != null && nowMillis >= expiryInstant.time

        if (isExpired) {
            currentReservation?.let { showExpiredState(it) }
        } else {
            tvStatusBadge.text = getString(R.string.qr_status_active)
            tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_approved))
            tvStatusBadge.visibility = View.VISIBLE

            tvInstructions.text = getString(R.string.qr_instructions)
            btnRefreshQr.visibility = View.VISIBLE
            btnRefreshQr.isEnabled = true
        }
    }
}
