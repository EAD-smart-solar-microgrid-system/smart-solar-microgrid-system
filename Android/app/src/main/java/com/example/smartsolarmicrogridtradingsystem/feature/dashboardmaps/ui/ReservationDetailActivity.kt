package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.DashboardBookingDto
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.StationCacheRepository
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity

/**
 * Read-only reservation detail screen for Member 4 booking views.
 */
class ReservationDetailActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reservation_detail)

        setupSystemBarPadding(findViewById(R.id.detailRoot))

        val booking = extractBooking(intent)
        if (booking == null) {
            finish()
            return
        }

        val displayBookingId = if (booking.bookingId.isNotBlank()) booking.bookingId else DashboardUiFormatter.formatBookingId(booking.id)
        findViewById<TextView>(R.id.tvDetailId).text =
            getString(R.string.detail_id, displayBookingId)
        findViewById<TextView>(R.id.tvDetailStatus).text =
            getString(R.string.detail_status, booking.status.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailType).text =
            getString(R.string.detail_type, booking.reservationType.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailDateTime).text =
            getString(
                R.string.detail_datetime,
                DashboardUiFormatter.formatDateTime(booking.reservationDateTime)
            )

        // Prosumer name display with profile fallback
        val tvDetailProsumer = findViewById<TextView>(R.id.tvDetailProsumer)
        val prosumerName = booking.prosumerName.trim()
        if (prosumerName.isNotEmpty()) {
            tvDetailProsumer.text = getString(R.string.detail_prosumer, prosumerName)
        } else if (booking.prosumerId.isNotBlank()) {
            tvDetailProsumer.text = getString(R.string.detail_prosumer, booking.prosumerId)
            val token = com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager(this).getToken()
            com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient.sendRequest(
                method = com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod.GET,
                endpoint = "prosumers/me",
                bearerToken = token,
                callback = object : com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback<String> {
                    override fun onSuccess(result: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult.Success<String>) {
                        try {
                            val obj = org.json.JSONObject(result.responseBody)
                            val name = obj.optString("fullName", obj.optString("FullName", "")).trim()
                            if (name.isNotEmpty()) {
                                tvDetailProsumer.text = getString(R.string.detail_prosumer, name)
                            }
                        } catch (_: Exception) {}
                    }
                    override fun onError(error: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult<Nothing>) {}
                }
            )
        } else {
            tvDetailProsumer.text = getString(R.string.detail_prosumer, "—")
        }

        // Hub ID display instead of Station ID
        val tvDetailStation = findViewById<TextView>(R.id.tvDetailStation)
        val initialHub = when {
            booking.hubId.isNotBlank() -> booking.hubId
            StationCacheRepository.resolveHubIdSync(booking.stationId)?.isNotBlank() == true ->
                StationCacheRepository.resolveHubIdSync(booking.stationId)!!
            else -> null
        }
        if (!initialHub.isNullOrBlank()) {
            tvDetailStation.text = getString(R.string.detail_station, initialHub)
        } else {
            StationCacheRepository(this).getHubId(booking.stationId) { hub ->
                val resolved = if (!hub.isNullOrBlank()) hub else DashboardUiFormatter.shortenId(booking.stationId)
                tvDetailStation.text = getString(R.string.detail_station, resolved)
            }
        }

        findViewById<TextView>(R.id.tvDetailSlot).text =
            getString(R.string.detail_slot, booking.slotId.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailCreated).text =
            getString(
                R.string.detail_created,
                DashboardUiFormatter.formatDateTime(booking.createdAt)
            )

        // Last update time instead of showing —
        val updateTimeRaw = booking.updatedAt.ifBlank { booking.createdAt }
        val formattedUpdate = DashboardUiFormatter.formatDateTime(updateTimeRaw)
        findViewById<TextView>(R.id.tvDetailUpdated).text =
            getString(
                R.string.detail_updated,
                if (formattedUpdate != "—") formattedUpdate else DashboardUiFormatter.formatDateTime(booking.createdAt)
            )

        val tvStationName = findViewById<TextView>(R.id.tvDetailStationName)
        if (booking.stationName.isNotBlank()) {
            tvStationName.text = getString(R.string.detail_station_name, booking.stationName)
        } else if (booking.stationId.isNotBlank()) {
            StationCacheRepository(this).getStationName(booking.stationId) { name ->
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

    private fun extractBooking(intent: Intent): DashboardBookingDto? {
        val id = intent.getStringExtra(EXTRA_ID) ?: return null
        return DashboardBookingDto(
            id = id,
            stationId = intent.getStringExtra(EXTRA_STATION_ID).orEmpty(),
            slotId = intent.getStringExtra(EXTRA_SLOT_ID).orEmpty(),
            prosumerId = intent.getStringExtra(EXTRA_PROSUMER_ID).orEmpty(),
            reservationDateTime = intent.getStringExtra(EXTRA_DATETIME).orEmpty(),
            status = intent.getStringExtra(EXTRA_STATUS).orEmpty(),
            reservationType = intent.getStringExtra(EXTRA_TYPE).orEmpty(),
            createdAt = intent.getStringExtra(EXTRA_CREATED).orEmpty(),
            updatedAt = intent.getStringExtra(EXTRA_UPDATED).orEmpty(),
            hubId = intent.getStringExtra(EXTRA_HUB_ID).orEmpty(),
            prosumerName = intent.getStringExtra(EXTRA_PROSUMER_NAME).orEmpty(),
            stationName = intent.getStringExtra(EXTRA_STATION_NAME).orEmpty(),
            bookingId = intent.getStringExtra(EXTRA_BOOKING_ID).orEmpty()
        )
    }

    companion object {
        private const val EXTRA_ID = "extra_id"
        private const val EXTRA_BOOKING_ID = "extra_booking_id"
        private const val EXTRA_STATION_ID = "extra_station_id"
        private const val EXTRA_SLOT_ID = "extra_slot_id"
        private const val EXTRA_PROSUMER_ID = "extra_prosumer_id"
        private const val EXTRA_DATETIME = "extra_datetime"
        private const val EXTRA_STATUS = "extra_status"
        private const val EXTRA_TYPE = "extra_type"
        private const val EXTRA_CREATED = "extra_created"
        private const val EXTRA_UPDATED = "extra_updated"
        private const val EXTRA_HUB_ID = "extra_hub_id"
        private const val EXTRA_PROSUMER_NAME = "extra_prosumer_name"
        private const val EXTRA_STATION_NAME = "extra_station_name"

        fun createIntent(context: Context, booking: DashboardBookingDto): Intent {
            return Intent(context, ReservationDetailActivity::class.java).apply {
                putExtra(EXTRA_ID, booking.id)
                putExtra(EXTRA_STATION_ID, booking.stationId)
                putExtra(EXTRA_SLOT_ID, booking.slotId)
                putExtra(EXTRA_PROSUMER_ID, booking.prosumerId)
                putExtra(EXTRA_DATETIME, booking.reservationDateTime)
                putExtra(EXTRA_STATUS, booking.status)
                putExtra(EXTRA_TYPE, booking.reservationType)
                putExtra(EXTRA_CREATED, booking.createdAt)
                putExtra(EXTRA_UPDATED, booking.updatedAt)
                putExtra(EXTRA_HUB_ID, booking.hubId)
                putExtra(EXTRA_PROSUMER_NAME, booking.prosumerName)
                putExtra(EXTRA_STATION_NAME, booking.stationName)
                putExtra(EXTRA_BOOKING_ID, if (booking.bookingId.isNotBlank()) booking.bookingId else DashboardUiFormatter.formatBookingId(booking.id))
            }
        }
    }
}
