package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardUiFormatter
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationStatus

/**
 * RecyclerView adapter for presenting Member 2 local cached reservations.
 */
class ReservationAdapter(
    private val onItemClick: ((ReservationDto) -> Unit)? = null
) : RecyclerView.Adapter<ReservationAdapter.ReservationViewHolder>() {

    private val items = mutableListOf<ReservationDto>()

    /**
     * Submits a fresh list of reservations to display in the list.
     */
    fun submitList(reservations: List<ReservationDto>) {
        items.clear()
        items.addAll(reservations)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReservationViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_reservation, parent, false)
        return ReservationViewHolder(view)
    }

    override fun onBindViewHolder(holder: ReservationViewHolder, position: Int) {
        val item = items[position]
        holder.bind(item)
        holder.itemView.setOnClickListener {
            onItemClick?.invoke(item)
        }
    }

    override fun getItemCount(): Int = items.size

    class ReservationViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvStatus: TextView = itemView.findViewById(R.id.tvReservationStatus)
        private val tvDateTime: TextView = itemView.findViewById(R.id.tvReservationDateTime)
        private val tvType: TextView = itemView.findViewById(R.id.tvReservationType)
        private val tvStation: TextView = itemView.findViewById(R.id.tvReservationStation)
        private val tvSlot: TextView = itemView.findViewById(R.id.tvReservationSlot)
        private val tvId: TextView = itemView.findViewById(R.id.tvReservationId)
        private val tvCancellation: TextView = itemView.findViewById(R.id.tvReservationCancellation)

        fun bind(item: ReservationDto) {
            val status = item.parsedStatus
            val statusLabel = when (status) {
                ReservationStatus.PENDING -> itemView.context.getString(R.string.status_pending_approval)
                ReservationStatus.APPROVED -> itemView.context.getString(R.string.status_approved)
                ReservationStatus.CANCELLED -> itemView.context.getString(R.string.status_cancelled)
                ReservationStatus.COMPLETED -> itemView.context.getString(R.string.status_completed)
            }
            tvStatus.text = statusLabel

            val statusColor = when (status) {
                ReservationStatus.PENDING -> ContextCompat.getColor(itemView.context, R.color.status_pending)
                ReservationStatus.APPROVED -> ContextCompat.getColor(itemView.context, R.color.status_approved)
                ReservationStatus.CANCELLED -> ContextCompat.getColor(itemView.context, R.color.status_cancelled)
                ReservationStatus.COMPLETED -> ContextCompat.getColor(itemView.context, R.color.status_completed)
            }
            tvStatus.setTextColor(statusColor)

            tvDateTime.text = DashboardUiFormatter.formatDateTime(item.reservationDateTime)

            val typeDisplayName = item.parsedType.displayName
            tvType.text = itemView.context.getString(R.string.reservation_item_type, typeDisplayName)

            // Lookup friendly station name from cache to avoid raw MongoDB ID
            if (item.stationId.isNotBlank()) {
                com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.StationCacheRepository(itemView.context)
                    .getStationName(item.stationId) { stationName ->
                        tvStation.text = if (!stationName.isNullOrBlank()) {
                            "Station: $stationName"
                        } else {
                            "Station: Central Solar Hub"
                        }
                    }
            } else {
                tvStation.text = "Station: Solar Station"
            }

            // Friendly slot label instead of raw 24-character hex MongoDB ID
            tvSlot.text = "Slot: Charging Slot 1"

            // Do not display cryptic raw MongoDB reservation ID in UI
            tvId.visibility = View.GONE

            if (!item.cancellationReason.isNullOrBlank()) {
                tvCancellation.visibility = View.VISIBLE
                tvCancellation.text = itemView.context.getString(
                    R.string.reservation_item_cancellation,
                    item.cancellationReason
                )
            } else {
                tvCancellation.visibility = View.GONE
            }
        }
    }
}
