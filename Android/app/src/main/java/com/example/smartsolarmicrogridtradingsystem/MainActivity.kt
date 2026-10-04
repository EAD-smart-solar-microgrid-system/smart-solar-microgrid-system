package com.example.smartsolarmicrogridtradingsystem

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardActivity
import com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui.OperatorDashboardActivity
import com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui.OperatorLoginActivity
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui.AppLoginActivity
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui.ProsumerProfileActivity
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui.ReservationListActivity
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.card.MaterialCardView

/**
 * Initial launcher screen for the Smart Solar Microgrid Trading System Android app.
 * Enforces role-based session checking and navigation to member features.
 */
class MainActivity : BaseActivity() {

    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)

        // Enforce login on app entry
        if (!sessionManager.isLoggedIn()) {
            startActivity(Intent(this, AppLoginActivity::class.java))
            finish()
            return
        }

        // If authenticated as Grid Operator, direct immediately to operator tools
        if (sessionManager.getRole() == "GridOperator") {
            startActivity(Intent(this, OperatorDashboardActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_main)

        val rootLayout: View? = findViewById(R.id.main)
        if (rootLayout != null) {
            setupSystemBarPadding(rootLayout, applyBottomPadding = false)
        }

        val tvAppSubtitle = findViewById<TextView?>(R.id.tvAppSubtitle)
        val userNic = sessionManager.getUserIdentifier()
        if (!userNic.isNullOrBlank() && tvAppSubtitle != null) {
            tvAppSubtitle.text = "Logged in: $userNic"
        }

        // Module 1: Reservation & QR Dispatch (Member 2)
        val reservationCard = findViewById<MaterialCardView>(R.id.cardReservationQr)
        val btnLaunchReservation = findViewById<View?>(R.id.btnLaunchReservation)
        val openReservation = {
            startActivity(Intent(this, ReservationListActivity::class.java))
        }
        reservationCard.setOnClickListener { openReservation() }
        btnLaunchReservation?.setOnClickListener { openReservation() }

        // Module 2: Dashboard & Maps (Member 4)
        val dashboardCard = findViewById<MaterialCardView>(R.id.cardDashboardMaps)
        val btnLaunchDashboard = findViewById<View?>(R.id.btnLaunchDashboard)
        val openDashboard = {
            startActivity(Intent(this, DashboardActivity::class.java))
        }
        dashboardCard.setOnClickListener { openDashboard() }
        btnLaunchDashboard?.setOnClickListener { openDashboard() }

        // Module 3: Operator Mode (Member 1)
        val operatorCard = findViewById<MaterialCardView>(R.id.cardOperatorMode)
        val btnLaunchOperator = findViewById<View?>(R.id.btnLaunchOperator)
        val openOperator = {
            startActivity(Intent(this, OperatorLoginActivity::class.java))
        }
        operatorCard.setOnClickListener { openOperator() }
        btnLaunchOperator?.setOnClickListener { openOperator() }

        // Module 4: Prosumer Account Control (Member 3)
        val prosumerCard = findViewById<MaterialCardView>(R.id.cardProsumerAccount)
        val btnLaunchProsumer = findViewById<View?>(R.id.btnLaunchProsumer)
        val openProsumer = {
            startActivity(
                Intent(
                    this,
                    com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui.ProsumerProfileActivity::class.java
                )
            )
        }
        prosumerCard.setOnClickListener { openProsumer() }
        btnLaunchProsumer?.setOnClickListener { openProsumer() }

        // Setup production bottom navigation shell
        com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui.BottomNavHelper.setup(
            this,
            com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui.BottomNavHelper.NavTab.HOME
        )
    }
}
