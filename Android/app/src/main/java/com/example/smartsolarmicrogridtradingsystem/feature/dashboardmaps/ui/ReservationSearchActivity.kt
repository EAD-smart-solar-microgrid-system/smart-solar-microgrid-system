package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Spinner
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
 * Member 4 search/filter screen over reservation monitoring records.
 */
class ReservationSearchActivity : BaseActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var repository: Member4DashboardRepository
    private lateinit var adapter: BookingListAdapter

    private lateinit var etProsumerId: EditText
    private lateinit var etStationId: EditText
    private lateinit var etSearch: EditText
    private lateinit var spinnerStatus: Spinner
    private lateinit var progress: ProgressBar
    private lateinit var layoutError: View
    private lateinit var tvError: TextView
    private lateinit var tvEmpty: TextView
    private lateinit var recyclerView: RecyclerView

    private val statusOptions = listOf(
        "" to "All statuses",
        "Pending" to "Pending",
        "Approved" to "Approved",
        "Cancelled" to "Cancelled",
        "Completed" to "Completed"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reservation_search)

        setupSystemBarPadding(findViewById(R.id.searchRoot))

        sessionManager = SessionManager(this)
        repository = Member4DashboardRepository()

        etProsumerId = findViewById(R.id.etFilterProsumerId)
        etStationId = findViewById(R.id.etFilterStationId)
        etSearch = findViewById(R.id.etFilterSearch)
        spinnerStatus = findViewById(R.id.spinnerStatus)
        progress = findViewById(R.id.progressSearch)
        layoutError = findViewById(R.id.layoutSearchError)
        tvError = findViewById(R.id.tvSearchError)
        tvEmpty = findViewById(R.id.tvSearchEmpty)
        recyclerView = findViewById(R.id.rvSearchResults)

        val initialProsumer = intent.getStringExtra(DashboardActivity.EXTRA_PROSUMER_ID)
            ?: sessionManager.getUserIdentifier()
        etProsumerId.setText(initialProsumer.orEmpty())

        spinnerStatus.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            statusOptions.map { it.second }
        )

        adapter = BookingListAdapter { booking ->
            startActivity(ReservationDetailActivity.createIntent(this, booking))
        }
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        findViewById<MaterialButton>(R.id.btnApplySearch).setOnClickListener { search() }
        findViewById<MaterialButton>(R.id.btnResetSearch).setOnClickListener { resetFilters() }
        findViewById<MaterialButton>(R.id.btnRetrySearch).setOnClickListener { search() }

        search()
    }

    private fun resetFilters() {
        etStationId.setText("")
        etSearch.setText("")
        spinnerStatus.setSelection(0)
        search()
    }

    private fun search() {
        showLoading()
        val selectedStatus = statusOptions.getOrNull(spinnerStatus.selectedItemPosition)?.first.orEmpty()
        val filters = mutableMapOf(
            "page" to "1",
            "pageSize" to "50"
        )

        etProsumerId.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let {
            filters["prosumerId"] = it
        }
        etStationId.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let {
            filters["stationId"] = it
        }
        etSearch.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let {
            filters["search"] = it
        }
        if (selectedStatus.isNotEmpty()) {
            filters["status"] = selectedStatus
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

    private fun showList(
        items: List<com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.DashboardBookingDto>
    ) {
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
}
