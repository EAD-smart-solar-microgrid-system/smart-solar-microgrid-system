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
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationLocalRepository
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
            setupSystemBarPadding(root)
        }

        sessionManager = SessionManager(this)
        localRepository = ReservationLocalRepository.getInstance(this)

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
    }

    override fun onResume() {
        super.onResume()
        loadReservationsFromCache()
    }

    private fun resolveProsumerNic(): String? {
        val typed = etProsumerNic.text?.toString()?.trim().orEmpty()
        if (typed.isNotEmpty()) {
            return typed
        }
        return sessionManager.getUserIdentifier()?.trim()?.takeIf { it.isNotEmpty() }
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

        AppExecutors.executeInBackground {
            val list = localRepository.getByProsumerNic(nic)

            AppExecutors.executeOnMainThread {
                progress.visibility = View.GONE
                adapter.submitList(list)

                if (list.isEmpty()) {
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
}
