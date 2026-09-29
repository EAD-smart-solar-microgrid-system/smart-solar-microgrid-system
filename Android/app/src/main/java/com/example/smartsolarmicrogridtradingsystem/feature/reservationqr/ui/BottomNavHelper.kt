package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui

import android.app.Activity
import android.content.Intent
import com.example.smartsolarmicrogridtradingsystem.MainActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardActivity
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.NearbyStationsMapActivity
import com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui.OperatorLoginActivity
import com.google.android.material.bottomnavigation.BottomNavigationView

/**
 * Shared production 5-item mobile bottom navigation helper.
 * Top-level destinations: Home, Reservations, Dashboard, Patrol, Operator.
 */
object BottomNavHelper {

    enum class NavTab(val menuId: Int) {
        HOME(R.id.nav_home),
        RESERVATIONS(R.id.nav_reservations),
        DASHBOARD(R.id.nav_dashboard),
        PATROL(R.id.nav_patrol),
        PROSUMER(R.id.nav_prosumer),
        OPERATOR(R.id.nav_prosumer)
    }

    fun setup(activity: Activity, currentTab: NavTab) {
        val navView = activity.findViewById<BottomNavigationView?>(R.id.bottomNavRoot) ?: return

        // Ensure system navigation bar insets are respected so icons are never obscured
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(navView) { v, insets ->
            val navBars = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.navigationBars())
            v.setPadding(0, 0, 0, navBars.bottom)
            insets
        }

        // Explicitly check current tab
        navView.setOnItemSelectedListener(null)
        navView.menu.findItem(currentTab.menuId)?.isChecked = true
        navView.selectedItemId = currentTab.menuId

        navView.setOnItemSelectedListener { item ->
            if (item.itemId == currentTab.menuId) {
                // Reselection of current tab: do nothing, or if on inner reservation screen, finish back to ReservationListActivity
                if (currentTab == NavTab.RESERVATIONS && activity !is ReservationListActivity && activity !is MainActivity) {
                    activity.finish()
                }
                return@setOnItemSelectedListener true
            }

            when (item.itemId) {
                R.id.nav_home -> {
                    val intent = Intent(activity, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    activity.startActivity(intent)
                    if (activity !is MainActivity && activity !is ReservationListActivity) {
                        activity.finish()
                    }
                    true
                }
                R.id.nav_reservations -> {
                    val intent = Intent(activity, ReservationListActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    activity.startActivity(intent)
                    if (activity !is MainActivity && activity !is ReservationListActivity) {
                        activity.finish()
                    }
                    true
                }
                R.id.nav_dashboard -> {
                    val intent = Intent(activity, DashboardActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    activity.startActivity(intent)
                    if (activity !is MainActivity && activity !is ReservationListActivity) {
                        activity.finish()
                    }
                    true
                }
                R.id.nav_patrol -> {
                    val intent = Intent(activity, NearbyStationsMapActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    activity.startActivity(intent)
                    if (activity !is MainActivity && activity !is ReservationListActivity) {
                        activity.finish()
                    }
                    true
                }
                R.id.nav_prosumer -> {
                    val intent = Intent(
                        activity,
                        com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui.ProsumerProfileActivity::class.java
                    ).apply {
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    activity.startActivity(intent)
                    if (activity !is MainActivity && activity !is ReservationListActivity) {
                        activity.finish()
                    }
                    true
                }
                else -> false
            }
        }

        navView.setOnItemReselectedListener { item ->
            if (item.itemId == R.id.nav_reservations && activity !is ReservationListActivity && activity !is MainActivity) {
                activity.finish()
            }
        }
    }
}
