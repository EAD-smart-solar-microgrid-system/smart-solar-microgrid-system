package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationLocalRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText

import android.content.Intent
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton

/**
 * Member 2 reservation list activity for displaying offline cached reservations.
 * Loads bookings from [ReservationLocalRepository] and allows filtering by prosumer NIC.
 */
class ReservationListActivity : BaseActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var localRepository: ReservationLocalRepository
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var adapter: ReservationAdapter

    private lateinit var etProsumerNic: TextInputEditText
    private lateinit var btnRefreshCache: MaterialButton
    private lateinit var fabNewReservation: ExtendedFloatingActionButton
    private lateinit var progress: ProgressBar
    private lateinit var tvEmpty: TextView
    private lateinit var recyclerView: RecyclerView

    private val createReservationLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { _ ->
        // Cache refresh is automatically handled in onResume() when returning to this screen
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reservation_list)

        val root = findViewById<View>(R.id.reservationListRoot)
        if (root != null) {
            setupSystemBarPadding(root, applyBottomPadding = false)
        }

        sessionManager = SessionManager(this)
        localRepository = ReservationLocalRepository.getInstance(this)
        reservationRepository = ReservationRepository.getInstance()

        etProsumerNic = findViewById(R.id.etProsumerNic)
        btnRefreshCache = findViewById(R.id.btnRefreshCache)
        fabNewReservation = findViewById(R.id.fabNewReservation)
        progress = findViewById(R.id.progressReservationList)
        tvEmpty = findViewById(R.id.tvReservationListEmpty)
        recyclerView = findViewById(R.id.rvReservationList)

        adapter = ReservationAdapter { reservation ->
            val intent = Intent(this, ReservationDetailActivity::class.java).apply {
                putExtra(ReservationDetailActivity.EXTRA_RESERVATION_ID, reservation.id)
                resolveProsumerNic()?.let { nic ->
                    putExtra(ReservationDetailActivity.EXTRA_PROSUMER_NIC, nic)
                }
            }
            startActivity(intent)
        }
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        // Pre-fill Prosumer NIC following team session pattern
        sessionManager.getUserIdentifier()?.trim()?.takeIf { it.isNotEmpty() }?.let { nic ->
            etProsumerNic.setText(nic)
        }

        btnRefreshCache.setOnClickListener {
            loadReservationsFromCache()
        }

        fabNewReservation.setOnClickListener {
            val intent = Intent(this, CreateReservationActivity::class.java).apply {
                resolveProsumerNic()?.let { nic ->
                    putExtra(CreateReservationActivity.EXTRA_PROSUMER_NIC, nic)
                }
            }
            createReservationLauncher.launch(intent)
        }

        // Setup production bottom navigation shell
        BottomNavHelper.setup(this, BottomNavHelper.NavTab.RESERVATIONS)
    }

    override fun onResume() {
        super.onResume()
        loadReservationsFromCache()
    }

    private fun resolveProsumerNic(): String? {
        val sessionNic = sessionManager.getUserIdentifier()?.trim()?.takeIf { it.isNotEmpty() }
        if (!sessionNic.isNullOrBlank()) {
            return sessionNic
        }
        return etProsumerNic.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun loadReservationsFromCache() {
        val nic = resolveProsumerNic()
        if (nic.isNullOrBlank()) {
            progress.visibility = View.GONE
            adapter.submitList(emptyList())
            tvEmpty.setText(R.string.reservation_nic_required_prompt)
            tvEmpty.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
            return
        }

        progress.visibility = View.VISIBLE
        tvEmpty.visibility = View.GONE

        // Pre-fetch and cache active stations so reservation cards display actual station names
        com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.StationSlotRepository().getStations(
            bearerToken = sessionManager.getToken(),
            callback = object : com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback<List<com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto>> {
                override fun onSuccess(result: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult.Success<List<com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto>>) {
                    com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.StationCacheRepository(this@ReservationListActivity)
                        .replaceAll(result.responseBody) {
                            adapter.notifyDataSetChanged()
                        }
                }
                override fun onError(error: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult<Nothing>) {}
            }
        )

        // 1. Immediately present cached reservations from SQLite
        AppExecutors.executeInBackground {
            val list = localRepository.getByProsumerNic(nic)

            AppExecutors.executeOnMainThread {
                if (list.isNotEmpty()) {
                    progress.visibility = View.GONE
                    adapter.submitList(list)
                    tvEmpty.visibility = View.GONE
                    recyclerView.visibility = View.VISIBLE
                }

                // 2. Fetch fresh reservation states from API to sync status changes (such as Approved)
                reservationRepository.getReservationsByNic(
                    nic = nic,
                    bearerToken = sessionManager.getToken(),
                    callback = object : ApiCallback<List<ReservationDto>> {
                        override fun onSuccess(result: NetworkResult.Success<List<ReservationDto>>) {
                            val serverList = result.responseBody
                            progress.visibility = View.GONE

                            AppExecutors.executeInBackground {
                                for (res in serverList) {
                                    localRepository.upsert(res)
                                }
                                val updatedList = localRepository.getByProsumerNic(nic)

                                AppExecutors.executeOnMainThread {
                                    adapter.submitList(updatedList)
                                    if (updatedList.isEmpty()) {
                                        tvEmpty.setText(R.string.reservation_list_empty)
                                        tvEmpty.visibility = View.VISIBLE
                                        recyclerView.visibility = View.GONE
                                    } else {
                                        tvEmpty.visibility = View.GONE
                                        recyclerView.visibility = View.VISIBLE
                                    }
                                }
                            }
                        }

                        override fun onError(error: NetworkResult<Nothing>) {
                            progress.visibility = View.GONE
                            if (list.isEmpty()) {
                                tvEmpty.setText(R.string.reservation_list_empty)
                                tvEmpty.visibility = View.VISIBLE
                                recyclerView.visibility = View.GONE
                            }
                        }
                    }
                )
            }
        }
    }
}
