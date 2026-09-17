package com.example.smartsolarmicrogridtradingsystem

import android.os.Bundle
import android.view.View
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity

/**
 * Initial launcher screen for the Smart Solar Microgrid Trading System Android app.
 *
 * Displays confirmation that the common architectural foundation is ready,
 * along with placeholder boundaries for the four upcoming member features.
 * Contains no feature navigation, authentication, or simulated data.
 */
class MainActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val rootLayout: View? = findViewById(R.id.main)
        if (rootLayout != null) {
            setupSystemBarPadding(rootLayout)
        }
    }
}