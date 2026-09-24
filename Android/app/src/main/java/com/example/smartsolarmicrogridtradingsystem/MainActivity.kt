package com.example.smartsolarmicrogridtradingsystem

import android.content.Intent
import android.os.Bundle
import android.view.View
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardActivity
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.card.MaterialCardView

/**
 * Initial launcher screen for the Smart Solar Microgrid Trading System Android app.
 *
 * Displays confirmation that the common architectural foundation is ready,
 * along with entry to the Member 4 Dashboard & Maps feature.
 */
class MainActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val rootLayout: View? = findViewById(R.id.main)
        if (rootLayout != null) {
            setupSystemBarPadding(rootLayout)
        }

        val dashboardCard = findViewById<MaterialCardView>(R.id.cardDashboardMaps)
        dashboardCard.setOnClickListener {
            startActivity(Intent(this, DashboardActivity::class.java))
        }
    }
}
