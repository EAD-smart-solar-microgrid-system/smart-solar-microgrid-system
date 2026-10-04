package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.DashboardBookingDto

/**
 * RecyclerView adapter for Member 4 booking list rows.
 */
class BookingListAdapter(
    private val onItemClick: (DashboardBookingDto) -> Unit
) : RecyclerView.Adapter<BookingListAdapter.BookingViewHolder>() {

    private val items = mutableListOf<DashboardBookingDto>()

    fun submitList(bookings: List<DashboardBookingDto>) {
        items.clear()
        items.addAll(bookings)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BookingViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_booking, parent, false)
        return BookingViewHolder(view)
    }

    override fun onBindViewHolder(holder: BookingViewHolder, position: Int) {
        holder.bind(items[position], onItemClick)
    }

    override fun getItemCount(): Int = items.size

    class BookingViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvStatus: TextView = itemView.findViewById(R.id.tvBookingStatus)
        private val tvDateTime: TextView = itemView.findViewById(R.id.tvBookingDateTime)
        private val tvType: TextView = itemView.findViewById(R.id.tvBookingType)
        private val tvStation: TextView = itemView.findViewById(R.id.tvBookingStation)
        private val tvId: TextView = itemView.findViewById(R.id.tvBookingId)

        fun bind(item: DashboardBookingDto, onItemClick: (DashboardBookingDto) -> Unit) {
            tvStatus.text = item.status.ifBlank { "Unknown" }
            tvDateTime.text = DashboardUiFormatter.formatDateTime(item.reservationDateTime)
            tvType.text = itemView.context.getString(
                R.string.booking_type_label,
                item.reservationType.ifBlank { "—" }
            )
            tvStation.text = itemView.context.getString(
                R.string.booking_station_label,
                DashboardUiFormatter.shortenId(item.stationId)
            )
            tvId.text = itemView.context.getString(
                R.string.booking_id_label,
                DashboardUiFormatter.shortenId(item.id)
            )
            itemView.setOnClickListener { onItemClick(item) }
        }
    }
}
