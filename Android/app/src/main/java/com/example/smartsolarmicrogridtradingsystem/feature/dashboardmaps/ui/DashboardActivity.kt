package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerDashboardDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto
import com.example.smartsolarmicrogridtradingsystem.data.repository.Member4DashboardRepository
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.StationCacheRepository
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.button.MaterialButton

/**
 * Member 4 dashboard screen showing pending/approved counts and recent bookings.
 */
class DashboardActivity : BaseActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var repository: Member4DashboardRepository
    private lateinit var stationCacheRepository: StationCacheRepository
    private lateinit var bookingAdapter: BookingListAdapter

    private lateinit var etProsumerId: EditText
    private lateinit var progressDashboard: ProgressBar
    private lateinit var tvDashboardError: TextView
    private lateinit var btnRetryDashboard: MaterialButton
    private lateinit var layoutMetrics: View
    private lateinit var tvPendingCount: TextView
    private lateinit var tvApprovedFutureCount: TextView
    private lateinit var tvRecentHeader: TextView
    private lateinit var rvRecentBookings: RecyclerView
    private lateinit var tvRecentEmpty: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val root = findViewById<View>(R.id.dashboardRoot)
        setupSystemBarPadding(root)

        sessionManager = SessionManager(this)
        repository = Member4DashboardRepository()
        stationCacheRepository = StationCacheRepository(this)

        etProsumerId = findViewById(R.id.etProsumerId)
        progressDashboard = findViewById(R.id.progressDashboard)
        tvDashboardError = findViewById(R.id.tvDashboardError)
        btnRetryDashboard = findViewById(R.id.btnRetryDashboard)
        layoutMetrics = findViewById(R.id.layoutMetrics)
        tvPendingCount = findViewById(R.id.tvPendingCount)
        tvApprovedFutureCount = findViewById(R.id.tvApprovedFutureCount)
        tvRecentHeader = findViewById(R.id.tvRecentHeader)
        rvRecentBookings = findViewById(R.id.rvRecentBookings)
        tvRecentEmpty = findViewById(R.id.tvRecentEmpty)

        bookingAdapter = BookingListAdapter { booking ->
            startActivity(ReservationDetailActivity.createIntent(this, booking))
        }
        rvRecentBookings.layoutManager = LinearLayoutManager(this)
        rvRecentBookings.adapter = bookingAdapter

        sessionManager.getUserIdentifier()?.let { nic ->
            etProsumerId.setText(nic)
        }

        findViewById<MaterialButton>(R.id.btnLoadDashboard).setOnClickListener {
            loadDashboard()
        }
        btnRetryDashboard.setOnClickListener {
            loadDashboard()
        }
        findViewById<MaterialButton>(R.id.btnOpenPending).setOnClickListener {
            openBookingList(BookingListActivity.MODE_PENDING)
        }
        findViewById<MaterialButton>(R.id.btnOpenHistory).setOnClickListener {
            openBookingList(BookingListActivity.MODE_HISTORY)
        }
        findViewById<MaterialButton>(R.id.btnOpenSearch).setOnClickListener {
            val intent = Intent(this, ReservationSearchActivity::class.java)
            intent.putExtra(EXTRA_PROSUMER_ID, resolveProsumerId())
            startActivity(intent)
        }
        findViewById<MaterialButton>(R.id.btnOpenNearbyMap).setOnClickListener {
            startActivity(Intent(this, NearbyStationsMapActivity::class.java))
        }

        refreshStationCache()
        if (!resolveProsumerId().isNullOrBlank()) {
            loadDashboard()
        }
    }

    private fun openBookingList(mode: String) {
        val intent = BookingListActivity.createIntent(this, mode, resolveProsumerId())
        startActivity(intent)
    }

    private fun resolveProsumerId(): String? {
        val typed = etProsumerId.text?.toString()?.trim().orEmpty()
        if (typed.isNotEmpty()) {
            return typed
        }
        return sessionManager.getUserIdentifier()?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun loadDashboard() {
        val prosumerId = resolveProsumerId()
        if (prosumerId.isNullOrBlank()) {
            showError(getString(R.string.error_prosumer_required))
            return
        }

        showLoading(true)
        repository.getProsumerDashboard(
            prosumerId = prosumerId,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<ProsumerDashboardDto> {
                override fun onSuccess(result: NetworkResult.Success<ProsumerDashboardDto>) {
                    showLoading(false)
                    bindDashboard(result.responseBody)
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    showLoading(false)
                    showError(mapError(error))
                }
            }
        )
    }

    private fun refreshStationCache() {
        repository.getStations(
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<List<StationReferenceDto>> {
                override fun onSuccess(result: NetworkResult.Success<List<StationReferenceDto>>) {
                    stationCacheRepository.replaceAll(result.responseBody)
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    // Station cache is best-effort reference data; dashboard can still load.
                }
            }
        )
    }

    private fun bindDashboard(dashboard: ProsumerDashboardDto) {
        tvDashboardError.visibility = View.GONE
        btnRetryDashboard.visibility = View.GONE
        layoutMetrics.visibility = View.VISIBLE
        tvRecentHeader.visibility = View.VISIBLE

        tvPendingCount.text = dashboard.pendingReservationCount.toString()
        tvApprovedFutureCount.text = dashboard.approvedFutureReservationCount.toString()

        bookingAdapter.submitList(dashboard.recentBookings)
        if (dashboard.recentBookings.isEmpty()) {
            rvRecentBookings.visibility = View.GONE
            tvRecentEmpty.visibility = View.VISIBLE
        } else {
            rvRecentBookings.visibility = View.VISIBLE
            tvRecentEmpty.visibility = View.GONE
        }
    }

    private fun showLoading(isLoading: Boolean) {
        progressDashboard.visibility = if (isLoading) View.VISIBLE else View.GONE
        if (isLoading) {
            tvDashboardError.visibility = View.GONE
            btnRetryDashboard.visibility = View.GONE
        }
    }

    private fun showError(message: String) {
        layoutMetrics.visibility = View.GONE
        tvRecentHeader.visibility = View.GONE
        rvRecentBookings.visibility = View.GONE
        tvRecentEmpty.visibility = View.GONE
        tvDashboardError.text = message
        tvDashboardError.visibility = View.VISIBLE
        btnRetryDashboard.visibility = View.VISIBLE
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
        const val EXTRA_PROSUMER_ID = "extra_prosumer_id"
    }
}
