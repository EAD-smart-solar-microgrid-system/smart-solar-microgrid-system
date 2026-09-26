package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerRepository
import com.example.smartsolarmicrogridtradingsystem.domain.model.ProsumerProfile
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity

/** Displays the authenticated Prosumer profile and deactivation action. */
class ProsumerProfileActivity : BaseActivity() {

    private lateinit var repository: ProsumerRepository
    private lateinit var messageView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var detailsCard: View
    private lateinit var actions: View
    private lateinit var deactivationButton: Button
    private var currentProfile: ProsumerProfile? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_prosumer_profile)
        setupSystemBarPadding(findViewById(R.id.profileRoot))

        repository = ProsumerRepository(this)
        messageView = findViewById(R.id.tvProfileMessage)
        progressBar = findViewById(R.id.progressProfile)
        detailsCard = findViewById(R.id.cardProfileDetails)
        actions = findViewById(R.id.profileActions)
        deactivationButton = findViewById(R.id.btnRequestDeactivation)
        findViewById<Button>(R.id.btnEditProfile).setOnClickListener {
            startActivity(Intent(this, EditProsumerProfileActivity::class.java))
        }
        deactivationButton.setOnClickListener { confirmDeactivation() }
        loadProfile()
    }

    override fun onResume() {
        super.onResume()
        if (::repository.isInitialized && currentProfile != null) loadProfile()
    }

    private fun loadProfile() {
        progressBar.visibility = View.VISIBLE
        repository.getCurrent { result ->
            progressBar.visibility = View.GONE
            when (result) {
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Success -> renderProfile(result.profile, null)
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Failure -> {
                    repository.getCached { cached ->
                        if (cached != null) renderProfile(cached, "Showing locally cached data. ${result.message}")
                        else showMessage(result.message)
                    }
                }
            }
        }
    }

    private fun renderProfile(profile: ProsumerProfile, notice: String?) {
        currentProfile = profile
        detailsCard.visibility = View.VISIBLE
        actions.visibility = View.VISIBLE
        findViewById<TextView>(R.id.tvProfileNic).text = profile.nic
        findViewById<TextView>(R.id.tvProfileFullName).text = profile.fullName
        findViewById<TextView>(R.id.tvProfileEmail).text = profile.email
        findViewById<TextView>(R.id.tvProfilePhone).text = profile.phoneNumber ?: "Not provided"
        findViewById<TextView>(R.id.tvProfileAddress).text = profile.address ?: "Not provided"
        findViewById<TextView>(R.id.tvProfileStatus).text = displayAccountStatus(profile.accountStatus)
        deactivationButton.isEnabled = profile.accountStatus == "Active"
        if (notice != null) showMessage(notice) else messageView.visibility = View.GONE
    }

    private fun confirmDeactivation() {
        AlertDialog.Builder(this)
            .setTitle("Request account deactivation")
            .setMessage("Are you sure you want to request account deactivation?")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Request") { _, _ -> sendDeactivationRequest() }
            .show()
    }

    private fun sendDeactivationRequest() {
        deactivationButton.isEnabled = false
        repository.requestDeactivation { result ->
            when (result) {
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Success -> renderProfile(result.profile, "Deactivation request submitted.")
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Failure -> {
                    currentProfile?.let { deactivationButton.isEnabled = it.accountStatus == "Active" }
                    showMessage(result.message)
                }
            }
        }
    }

    private fun showMessage(message: String) {
        messageView.text = message
        messageView.visibility = View.VISIBLE
    }
}
