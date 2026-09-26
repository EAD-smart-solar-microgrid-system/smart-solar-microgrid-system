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

        findViewById<TextView>(R.id.tvDetailId).text =
            getString(R.string.detail_id, booking.id)
        findViewById<TextView>(R.id.tvDetailStatus).text =
            getString(R.string.detail_status, booking.status.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailType).text =
            getString(R.string.detail_type, booking.reservationType.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailDateTime).text =
            getString(
                R.string.detail_datetime,
                DashboardUiFormatter.formatDateTime(booking.reservationDateTime)
            )
        findViewById<TextView>(R.id.tvDetailProsumer).text =
            getString(R.string.detail_prosumer, booking.prosumerId.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailStation).text =
            getString(R.string.detail_station, booking.stationId.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailSlot).text =
            getString(R.string.detail_slot, booking.slotId.ifBlank { "—" })
        findViewById<TextView>(R.id.tvDetailCreated).text =
            getString(
                R.string.detail_created,
                DashboardUiFormatter.formatDateTime(booking.createdAt)
            )
        findViewById<TextView>(R.id.tvDetailUpdated).text =
            getString(
                R.string.detail_updated,
                DashboardUiFormatter.formatDateTime(booking.updatedAt)
            )

        val tvStationName = findViewById<TextView>(R.id.tvDetailStationName)
        if (booking.stationId.isNotBlank()) {
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
            updatedAt = intent.getStringExtra(EXTRA_UPDATED).orEmpty()
        )
    }

    companion object {
        private const val EXTRA_ID = "extra_id"
        private const val EXTRA_STATION_ID = "extra_station_id"
        private const val EXTRA_SLOT_ID = "extra_slot_id"
        private const val EXTRA_PROSUMER_ID = "extra_prosumer_id"
        private const val EXTRA_DATETIME = "extra_datetime"
        private const val EXTRA_STATUS = "extra_status"
        private const val EXTRA_TYPE = "extra_type"
        private const val EXTRA_CREATED = "extra_created"
        private const val EXTRA_UPDATED = "extra_updated"

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
            }
        }
    }
}
