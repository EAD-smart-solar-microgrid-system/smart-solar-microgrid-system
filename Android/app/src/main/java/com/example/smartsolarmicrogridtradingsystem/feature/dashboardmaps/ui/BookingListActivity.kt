package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ReservationMonitoringListDto
import com.example.smartsolarmicrogridtradingsystem.data.repository.Member4DashboardRepository
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.button.MaterialButton

/**
 * Shared Member 4 list screen for pending bookings and booking history.
 */
class BookingListActivity : BaseActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var repository: Member4DashboardRepository
    private lateinit var adapter: BookingListAdapter

    private lateinit var tvTitle: TextView
    private lateinit var tvSubtitle: TextView
    private lateinit var progress: ProgressBar
    private lateinit var layoutError: View
    private lateinit var tvError: TextView
    private lateinit var tvEmpty: TextView
    private lateinit var recyclerView: RecyclerView

    private var mode: String = MODE_HISTORY
    private var prosumerId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_booking_list)

        setupSystemBarPadding(findViewById(R.id.bookingListRoot))

        sessionManager = SessionManager(this)
        repository = Member4DashboardRepository()

        mode = intent.getStringExtra(EXTRA_MODE) ?: MODE_HISTORY
        prosumerId = intent.getStringExtra(EXTRA_PROSUMER_ID)
            ?: sessionManager.getUserIdentifier()

        tvTitle = findViewById(R.id.tvBookingListTitle)
        tvSubtitle = findViewById(R.id.tvBookingListSubtitle)
        progress = findViewById(R.id.progressBookingList)
        layoutError = findViewById(R.id.layoutBookingError)
        tvError = findViewById(R.id.tvBookingListError)
        tvEmpty = findViewById(R.id.tvBookingListEmpty)
        recyclerView = findViewById(R.id.rvBookingList)

        adapter = BookingListAdapter { booking ->
            startActivity(ReservationDetailActivity.createIntent(this, booking))
        }
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        if (mode == MODE_PENDING) {
            tvTitle.setText(R.string.pending_bookings_title)
            tvSubtitle.setText(R.string.pending_bookings_subtitle)
        } else {
            tvTitle.setText(R.string.booking_history_title)
            tvSubtitle.setText(R.string.booking_history_subtitle)
        }

        findViewById<MaterialButton>(R.id.btnRetryBookingList).setOnClickListener {
            loadBookings()
        }

        loadBookings()
    }

    private fun loadBookings() {
        if (prosumerId.isNullOrBlank()) {
            showError(getString(R.string.error_prosumer_required))
            return
        }

        showLoading()
        val filters = mutableMapOf(
            "prosumerId" to prosumerId!!.trim(),
            "page" to "1",
            "pageSize" to "50"
        )
        if (mode == MODE_PENDING) {
            filters["status"] = "Pending"
        }

        repository.getReservationMonitoring(
            filters = filters,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<ReservationMonitoringListDto> {
                override fun onSuccess(result: NetworkResult.Success<ReservationMonitoringListDto>) {
                    val items = result.responseBody.items
                    if (items.isEmpty()) {
                        showEmpty()
                    } else {
                        showList(items)
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    showError(mapError(error))
                }
            }
        )
    }

    private fun showLoading() {
        progress.visibility = View.VISIBLE
        layoutError.visibility = View.GONE
        tvEmpty.visibility = View.GONE
        recyclerView.visibility = View.GONE
    }

    private fun showList(items: List<com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.DashboardBookingDto>) {
        progress.visibility = View.GONE
        layoutError.visibility = View.GONE
        tvEmpty.visibility = View.GONE
        recyclerView.visibility = View.VISIBLE
        adapter.submitList(items)
    }

    private fun showEmpty() {
        progress.visibility = View.GONE
        layoutError.visibility = View.GONE
        recyclerView.visibility = View.GONE
        tvEmpty.visibility = View.VISIBLE
        adapter.submitList(emptyList())
    }

    private fun showError(message: String) {
        progress.visibility = View.GONE
        recyclerView.visibility = View.GONE
        tvEmpty.visibility = View.GONE
        layoutError.visibility = View.VISIBLE
        tvError.text = message
    }

    private fun mapError(error: NetworkResult<Nothing>): String {
        return when (error) {
            is NetworkResult.Unauthorized -> getString(R.string.error_unauthorized)
            is NetworkResult.HttpError -> error.errorBody?.takeIf { it.isNotBlank() }
                ?: getString(R.string.error_api_generic, error.statusCode)
            is NetworkResult.NetworkError -> error.message
                ?: getString(R.string.error_network)
            else -> getString(R.string.error_unknown)
        }
    }

    companion object {
        const val EXTRA_MODE = "extra_mode"
        const val EXTRA_PROSUMER_ID = "extra_prosumer_id"
        const val MODE_PENDING = "pending"
        const val MODE_HISTORY = "history"

        fun createIntent(context: Context, mode: String, prosumerId: String?): Intent {
            return Intent(context, BookingListActivity::class.java).apply {
                putExtra(EXTRA_MODE, mode)
                putExtra(EXTRA_PROSUMER_ID, prosumerId)
            }
        }
    }
}
