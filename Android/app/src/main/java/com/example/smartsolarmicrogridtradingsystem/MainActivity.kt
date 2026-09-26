package com.example.smartsolarmicrogridtradingsystem

import android.os.Bundle
import android.content.Intent
import android.view.View
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui.ProsumerProfileActivity
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui.ProsumerRegistrationActivity

/**
 * Initial launcher screen for the Smart Solar Microgrid Trading System Android app.
 *
 * Displays confirmation that the common architectural foundation is ready,
 * along with navigation into the Member 3 Prosumer account screens.
 * The remaining member feature cards stay visibly disabled until implemented.
 */
class MainActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val rootLayout: View? = findViewById(R.id.main)
        if (rootLayout != null) {
            setupSystemBarPadding(rootLayout)
        }

        findViewById<View>(R.id.btnOpenRegistration).setOnClickListener {
            startActivity(Intent(this, ProsumerRegistrationActivity::class.java))
        }
        findViewById<View>(R.id.btnOpenProfile).setOnClickListener {
            startActivity(Intent(this, ProsumerProfileActivity::class.java))
        }
    }
}
