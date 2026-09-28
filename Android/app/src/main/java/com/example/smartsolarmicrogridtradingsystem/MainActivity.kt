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
            setupSystemBarPadding(rootLayout)
        }

        val tvAppSubtitle = findViewById<TextView>(R.id.tvAppSubtitle)
        val userNic = sessionManager.getUserIdentifier()
        if (!userNic.isNullOrBlank()) {
            tvAppSubtitle.text = "Logged in as Prosumer: $userNic"
        }

        val prosumerCard = findViewById<MaterialCardView>(R.id.cardProsumerAccount)
        prosumerCard.setOnClickListener {
            startActivity(Intent(this, ProsumerProfileActivity::class.java))
        }

        val reservationCard = findViewById<MaterialCardView>(R.id.cardReservationQr)
        reservationCard.setOnClickListener {
            startActivity(Intent(this, ReservationListActivity::class.java))
        }

        val dashboardCard = findViewById<MaterialCardView>(R.id.cardDashboardMaps)
        dashboardCard.setOnClickListener {
            startActivity(Intent(this, DashboardActivity::class.java))
        }

        val operatorCard = findViewById<MaterialCardView>(R.id.cardOperatorMode)
        operatorCard.setOnClickListener {
            startActivity(Intent(this, OperatorLoginActivity::class.java))
        }
    }
}
