package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
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
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.CancelReservationRequest
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationStatus
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.util.ReservationTimeHelper
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder

/**
 * Member 2 activity for displaying detailed reservation records, inspecting operational status,
 * enforcing the 12-hour advance notice window, and routing to edit and cancellation actions.
 */
class ReservationDetailActivity : BaseActivity() {

    companion object {
        const val EXTRA_RESERVATION_ID = "EXTRA_RESERVATION_ID"
        const val EXTRA_PROSUMER_NIC = "EXTRA_PROSUMER_NIC"
    }

    private lateinit var sessionManager: SessionManager
    private lateinit var localRepository: ReservationLocalRepository
    private lateinit var reservationRepository: ReservationRepository

    private lateinit var tvId: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvType: TextView
    private lateinit var tvDateTime: TextView
    private lateinit var tvProsumer: TextView
    private lateinit var tvStation: TextView
    private lateinit var tvStationName: TextView
    private lateinit var tvSlot: TextView
    private lateinit var tvCreated: TextView
    private lateinit var tvUpdated: TextView
    private lateinit var tvCancellationReason: TextView
    private lateinit var tvCancelledAt: TextView
    private lateinit var tvNoticeExplanation: TextView
    private lateinit var tvError: TextView
    private lateinit var progress: ProgressBar
    private lateinit var layoutActions: LinearLayout
    private lateinit var btnEdit: MaterialButton
    private lateinit var btnCancel: MaterialButton
    private lateinit var btnViewQr: MaterialButton
    private lateinit var tvQrNotice: TextView

    private var reservationId: String = ""
    private var currentReservation: ReservationDto? = null

    private val editLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            setResult(RESULT_OK)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_member2_reservation_detail)

        val root = findViewById<View>(R.id.member2DetailRoot)
        if (root != null) {
            setupSystemBarPadding(root)
        }

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarReservationDetail)
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
        loadReservation()
    }

    private fun initViews() {
        tvId = findViewById(R.id.tvDetailId)
        tvStatus = findViewById(R.id.tvDetailStatus)
        tvType = findViewById(R.id.tvDetailType)
        tvDateTime = findViewById(R.id.tvDetailDateTime)
        tvProsumer = findViewById(R.id.tvDetailProsumer)
        tvStation = findViewById(R.id.tvDetailStation)
        tvStationName = findViewById(R.id.tvDetailStationName)
        tvSlot = findViewById(R.id.tvDetailSlot)
        tvCreated = findViewById(R.id.tvDetailCreated)
        tvUpdated = findViewById(R.id.tvDetailUpdated)
        tvCancellationReason = findViewById(R.id.tvDetailCancellationReason)
        tvCancelledAt = findViewById(R.id.tvDetailCancelledAt)
        tvNoticeExplanation = findViewById(R.id.tvDetailNoticeExplanation)
        tvError = findViewById(R.id.tvDetailError)
        progress = findViewById(R.id.progressReservationDetail)
        layoutActions = findViewById(R.id.layoutDetailActions)
        btnEdit = findViewById(R.id.btnEditReservation)
        btnCancel = findViewById(R.id.btnCancelReservation)
        btnViewQr = findViewById(R.id.btnViewQrDispatch)
        tvQrNotice = findViewById(R.id.tvDetailQrNotice)
    }

    private fun setupListeners() {
        btnEdit.setOnClickListener {
            val record = currentReservation ?: return@setOnClickListener
            val intent = Intent(this, EditReservationActivity::class.java).apply {
                putExtra(EditReservationActivity.EXTRA_RESERVATION_ID, record.id)
                putExtra(EditReservationActivity.EXTRA_PROSUMER_NIC, record.prosumerNic)
            }
            editLauncher.launch(intent)
        }

        btnCancel.setOnClickListener {
            showCancelConfirmationDialog()
        }

        btnViewQr.setOnClickListener {
            val record = currentReservation ?: return@setOnClickListener
            if (record.parsedStatus == ReservationStatus.APPROVED) {
                val intent = Intent(this, QrDispatchActivity::class.java).apply {
                    putExtra(QrDispatchActivity.EXTRA_RESERVATION_ID, record.id)
                    val expectedNic = intent.getStringExtra(EXTRA_PROSUMER_NIC)?.trim()
                        ?: sessionManager.getUserIdentifier()?.trim()
                    if (!expectedNic.isNullOrBlank()) {
                        putExtra(QrDispatchActivity.EXTRA_PROSUMER_NIC, expectedNic)
                    }
                }
                startActivity(intent)
            }
        }
    }

    private fun loadReservation() {
        progress.visibility = View.VISIBLE
        tvError.visibility = View.GONE

        AppExecutors.executeInBackground {
            val record = localRepository.getById(reservationId)

            AppExecutors.executeOnMainThread {
                progress.visibility = View.GONE

                if (record == null) {
                    Toast.makeText(this@ReservationDetailActivity, R.string.error_reservation_not_found, Toast.LENGTH_SHORT).show()
                    finish()
                    return@executeOnMainThread
                }

                // Security / scoping check against session context or passed NIC
                val expectedNic = intent.getStringExtra(EXTRA_PROSUMER_NIC)?.trim()
                    ?: sessionManager.getUserIdentifier()?.trim()

                if (!expectedNic.isNullOrBlank() && !record.prosumerNic.equals(expectedNic, ignoreCase = true)) {
                    Toast.makeText(this@ReservationDetailActivity, R.string.error_reservation_unauthorized, Toast.LENGTH_SHORT).show()
                    finish()
                    return@executeOnMainThread
                }

                currentReservation = record
                bindReservation(record)
            }
        }
    }

    private fun bindReservation(record: ReservationDto) {
        tvId.text = getString(R.string.detail_id, record.id)
        tvStatus.text = getString(R.string.detail_status, record.status)

        val statusColor = when (record.parsedStatus) {
            ReservationStatus.PENDING -> ContextCompat.getColor(this, R.color.status_pending)
            ReservationStatus.APPROVED -> ContextCompat.getColor(this, R.color.status_approved)
            ReservationStatus.CANCELLED -> ContextCompat.getColor(this, R.color.status_cancelled)
            ReservationStatus.COMPLETED -> ContextCompat.getColor(this, R.color.status_completed)
        }
        tvStatus.setTextColor(statusColor)

        tvType.text = getString(R.string.detail_type, record.parsedType.displayName)
        tvDateTime.text = getString(R.string.detail_datetime, DashboardUiFormatter.formatDateTime(record.reservationDateTime))
        tvProsumer.text = getString(R.string.detail_prosumer, record.prosumerNic)
        tvStation.text = getString(R.string.detail_station, record.stationId)
        tvSlot.text = getString(R.string.detail_slot, record.slotId)
        tvCreated.text = getString(R.string.detail_created, DashboardUiFormatter.formatDateTime(record.createdAt))
        tvUpdated.text = getString(R.string.detail_updated, DashboardUiFormatter.formatDateTime(record.updatedAt))

        // Station name lookup via cache
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

        // Cancellation details
        if (!record.cancellationReason.isNullOrBlank()) {
            tvCancellationReason.text = getString(R.string.detail_cancellation_reason, record.cancellationReason)
            tvCancellationReason.visibility = View.VISIBLE
        } else {
            tvCancellationReason.visibility = View.GONE
        }

        if (!record.cancelledAt.isNullOrBlank()) {
            tvCancelledAt.text = getString(R.string.detail_cancelled_at, DashboardUiFormatter.formatDateTime(record.cancelledAt))
            tvCancelledAt.visibility = View.VISIBLE
        } else {
            tvCancelledAt.visibility = View.GONE
        }

        configureStatusActions(record)
    }

    private fun configureStatusActions(record: ReservationDto) {
        when (record.parsedStatus) {
            ReservationStatus.CANCELLED -> {
                btnViewQr.visibility = View.GONE
                tvQrNotice.visibility = View.GONE
                btnEdit.visibility = View.GONE
                btnCancel.visibility = View.GONE
                tvNoticeExplanation.text = getString(R.string.detail_status_locked, "Cancelled")
                tvNoticeExplanation.visibility = View.VISIBLE
            }
            ReservationStatus.COMPLETED -> {
                btnViewQr.visibility = View.GONE
                tvQrNotice.visibility = View.GONE
                btnEdit.visibility = View.GONE
                btnCancel.visibility = View.GONE
                tvNoticeExplanation.text = getString(R.string.detail_status_locked, "Completed")
                tvNoticeExplanation.visibility = View.VISIBLE
            }
            ReservationStatus.PENDING -> {
                btnViewQr.visibility = View.GONE
                tvQrNotice.text = getString(R.string.msg_qr_pending_notice)
                tvQrNotice.visibility = View.VISIBLE

                val has12Hours = ReservationTimeHelper.hasTwelveHoursNotice(record.reservationDateTime)
                btnEdit.visibility = View.VISIBLE
                btnCancel.visibility = View.VISIBLE

                if (has12Hours) {
                    btnEdit.isEnabled = true
                    btnCancel.isEnabled = true
                    tvNoticeExplanation.visibility = View.GONE
                } else {
                    btnEdit.isEnabled = false
                    btnCancel.isEnabled = false
                    tvNoticeExplanation.text = getString(R.string.detail_notice_expired)
                    tvNoticeExplanation.visibility = View.VISIBLE
                }
            }
            ReservationStatus.APPROVED -> {
                btnViewQr.visibility = View.VISIBLE
                btnViewQr.isEnabled = true
                tvQrNotice.visibility = View.GONE

                val has12Hours = ReservationTimeHelper.hasTwelveHoursNotice(record.reservationDateTime)
                btnEdit.visibility = View.VISIBLE
                btnCancel.visibility = View.VISIBLE

                if (has12Hours) {
                    btnEdit.isEnabled = true
                    btnCancel.isEnabled = true
                    tvNoticeExplanation.visibility = View.GONE
                } else {
                    btnEdit.isEnabled = false
                    btnCancel.isEnabled = false
                    tvNoticeExplanation.text = getString(R.string.detail_notice_expired)
                    tvNoticeExplanation.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun showCancelConfirmationDialog() {
        val record = currentReservation ?: return

        if (!ReservationTimeHelper.hasTwelveHoursNotice(record.reservationDateTime)) {
            Toast.makeText(this, R.string.detail_notice_expired, Toast.LENGTH_LONG).show()
            return
        }

        val input = EditText(this).apply {
            hint = getString(R.string.dialog_cancel_reason_hint)
            setPadding(48, 32, 48, 32)
        }

        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.dialog_cancel_title)
            .setMessage(R.string.dialog_cancel_message)
            .setView(input)
            .setPositiveButton(R.string.action_confirm_cancel) { _, _ ->
                val reason = input.text.toString().trim().takeIf { it.isNotEmpty() }
                executeCancellation(record.id, reason)
            }
            .setNegativeButton(R.string.action_keep_reservation, null)
            .show()
    }

    private fun executeCancellation(id: String, reason: String?) {
        progress.visibility = View.VISIBLE
        btnEdit.isEnabled = false
        btnCancel.isEnabled = false
        tvError.visibility = View.GONE

        val request = CancelReservationRequest(reason = reason)

        reservationRepository.cancelReservation(
            id = id,
            request = request,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<ReservationDto> {
                override fun onSuccess(result: NetworkResult.Success<ReservationDto>) {
                    val dto = result.responseBody

                    // Execute SQLite write and verify before updating UI
                    AppExecutors.executeInBackground {
                        val rowId = try {
                            localRepository.upsert(dto)
                        } catch (_: Exception) {
                            -1L
                        }

                        AppExecutors.executeOnMainThread {
                            progress.visibility = View.GONE

                            if (rowId != -1L) {
                                Toast.makeText(
                                    this@ReservationDetailActivity,
                                    R.string.msg_reservation_cancelled,
                                    Toast.LENGTH_SHORT
                                ).show()
                                setResult(RESULT_OK)
                                currentReservation = dto
                                bindReservation(dto)
                            } else {
                                tvError.text = getString(R.string.error_reservation_cancel_cache_failed)
                                tvError.visibility = View.VISIBLE
                                Toast.makeText(
                                    this@ReservationDetailActivity,
                                    R.string.error_reservation_cancel_cache_failed,
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    progress.visibility = View.GONE
                    val record = currentReservation
                    if (record != null) {
                        configureStatusActions(record)
                    }
                    val message = ReservationRepository.extractErrorMessage(error)
                    tvError.text = message
                    tvError.visibility = View.VISIBLE
                }
            }
        )
    }
}
