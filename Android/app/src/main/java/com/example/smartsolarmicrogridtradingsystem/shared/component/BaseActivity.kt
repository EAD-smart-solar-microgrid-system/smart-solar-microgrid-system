package com.example.smartsolarmicrogridtradingsystem.shared.component

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Base activity providing common edge-to-edge display configuration and system bar padding.
 *
 * Design constraints:
 * - Does not include authentication or session checks.
 * - Does not include navigation logic or menus.
 * - Does not include feature-specific code.
 */
abstract class BaseActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
    }

    /**
     * Convenience method to configure standard window insets on a designated root view.
     *
     * @param rootView The root layout view that should receive system bar padding.
     */
    protected fun setupSystemBarPadding(rootView: View) {
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
    }
}
