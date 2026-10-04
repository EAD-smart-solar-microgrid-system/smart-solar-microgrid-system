package com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui

import android.content.Intent
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class OperatorDashboardActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private var activeReservationId: String? = null

    private lateinit var tvOperatorUser: TextView
    private lateinit var btnLogout: MaterialButton
    private lateinit var btnScanQr: MaterialButton
    private lateinit var pbScanLoading: ProgressBar
    private lateinit var tvScanStatus: TextView

    private lateinit var cardVerifiedTransaction: MaterialCardView
    private lateinit var tvVerifiedStatus: TextView
    private lateinit var tvVerifiedReservationId: TextView
    private lateinit var tvVerifiedProsumer: TextView
    private lateinit var tvVerifiedStation: TextView
    private lateinit var tvVerifiedSlot: TextView
    private lateinit var tvVerifiedDateTime: TextView
    private lateinit var tvVerifiedType: TextView
    private lateinit var btnFinalize: MaterialButton
    private lateinit var btnClear: MaterialButton

    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result ->
        if (result.contents == null) {
            tvScanStatus.text = "Scan cancelled"
            tvScanStatus.visibility = View.VISIBLE
            tvScanStatus.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray))
        } else {
            verifyQrToken(result.contents.trim())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_operator_dashboard)
        sessionManager = SessionManager(this)

        // Check authentication
        if (!sessionManager.isLoggedIn() || sessionManager.getRole() != "GridOperator") {
            logout()
            return
        }

        initViews()
        setupListeners()
    }

    private fun initViews() {
        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarOperatorDashboard)
        toolbar.setNavigationOnClickListener { finish() }

        tvOperatorUser = findViewById(R.id.tvOperatorUser)
        btnLogout = findViewById(R.id.btnLogout)
        btnScanQr = findViewById(R.id.btnScanQr)
        pbScanLoading = findViewById(R.id.pbScanLoading)
        tvScanStatus = findViewById(R.id.tvScanStatus)

        cardVerifiedTransaction = findViewById(R.id.cardVerifiedTransaction)
        tvVerifiedStatus = findViewById(R.id.tvVerifiedStatus)
        tvVerifiedReservationId = findViewById(R.id.tvVerifiedReservationId)
        tvVerifiedProsumer = findViewById(R.id.tvVerifiedProsumer)
        tvVerifiedStation = findViewById(R.id.tvVerifiedStation)
        tvVerifiedSlot = findViewById(R.id.tvVerifiedSlot)
        tvVerifiedDateTime = findViewById(R.id.tvVerifiedDateTime)
        tvVerifiedType = findViewById(R.id.tvVerifiedType)
        btnFinalize = findViewById(R.id.btnFinalize)
        btnClear = findViewById(R.id.btnClear)

        val username = sessionManager.getUserIdentifier() ?: "Operator"
        tvOperatorUser.text = "Logged in as: $username (Grid Operator)"
    }

    private fun setupListeners() {
        btnLogout.setOnClickListener {
            logout()
        }

        btnScanQr.setOnClickListener {
            val options = ScanOptions().apply {
                setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                setPrompt("Scan Prosumer's QR Code")
                setCameraId(0)
                setBeepEnabled(true)
                setBarcodeImageEnabled(true)
                setOrientationLocked(false)
            }
            barcodeLauncher.launch(options)
        }

        btnFinalize.setOnClickListener {
            val resId = activeReservationId
            if (!resId.isNullOrBlank()) {
                showFinalizeConfirmation(resId)
            }
        }

        btnClear.setOnClickListener {
            resetVerifiedCard()
        }
    }

    private fun verifyQrToken(qrToken: String) {
        val token = sessionManager.getToken()
        if (token.isNullOrEmpty()) {
            Toast.makeText(this, "Session expired, please log in again", Toast.LENGTH_SHORT).show()
            logout()
            return
        }

        pbScanLoading.visibility = View.VISIBLE
        btnScanQr.isEnabled = false
        tvScanStatus.visibility = View.VISIBLE
        tvScanStatus.text = "Verifying QR token with server..."
        tvScanStatus.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray))
        cardVerifiedTransaction.visibility = View.GONE

        AppExecutors.executeInBackground {
            try {
                val url = URL(ApiClient.resolveUrl("api/transactions/verify-qr"))
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.doOutput = true

                val req = JSONObject().apply { put("qrToken", qrToken) }
                OutputStreamWriter(conn.outputStream).use { it.write(req.toString()) }

                val responseCode = conn.responseCode
                if (responseCode == 200) {
                    val res = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(res)
                    val reservationId = json.optString("reservationId", "")
                    val prosumerNic = json.optString("prosumerNic", "-")
                    val stationId = json.optString("stationId", "-")
                    val slotId = json.optString("slotId", "-")
                    val reservationDateTime = json.optString("reservationDateTime", "-")
                    val reservationType = json.optString("reservationType", "-")
                    val status = json.optString("status", "Approved")

                    runOnUiThread {
                        pbScanLoading.visibility = View.GONE
                        btnScanQr.isEnabled = true
                        activeReservationId = reservationId

                        tvVerifiedReservationId.text = "Reservation ID: $reservationId"
                        tvVerifiedProsumer.text = "Prosumer NIC: $prosumerNic"
                        tvVerifiedStation.text = "Station ID: $stationId"
                        tvVerifiedSlot.text = "Slot ID: $slotId"
                        tvVerifiedDateTime.text = "Scheduled: $reservationDateTime"
                        tvVerifiedType.text = "Transfer Type: $reservationType"
                        tvVerifiedStatus.text = status
                        tvVerifiedStatus.backgroundTintList = ColorStateList.valueOf(
                            ContextCompat.getColor(this@OperatorDashboardActivity, R.color.status_approved)
                        )

                        btnFinalize.isEnabled = true
                        btnFinalize.text = getString(R.string.operator_finalize_action)
                        cardVerifiedTransaction.visibility = View.VISIBLE

                        tvScanStatus.text = "✓ QR Token Verified Successfully"
                        tvScanStatus.setTextColor(
                            ContextCompat.getColor(this@OperatorDashboardActivity, R.color.status_approved)
                        )
                    }
                } else {
                    val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
                    val errorMessage = try {
                        if (!errorBody.isNullOrBlank()) {
                            JSONObject(errorBody).optString("message", "Invalid or expired QR code")
                        } else "Invalid or expired QR code"
                    } catch (e: Exception) {
                        "Invalid QR Code (HTTP $responseCode)"
                    }

                    runOnUiThread {
                        pbScanLoading.visibility = View.GONE
                        btnScanQr.isEnabled = true
                        tvScanStatus.text = "✗ $errorMessage"
                        tvScanStatus.setTextColor(
                            ContextCompat.getColor(this@OperatorDashboardActivity, R.color.status_cancelled)
                        )
                        Toast.makeText(this@OperatorDashboardActivity, errorMessage, Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    pbScanLoading.visibility = View.GONE
                    btnScanQr.isEnabled = true
                    val err = "Verification failed: ${e.localizedMessage ?: "Unable to connect to server"}"
                    tvScanStatus.text = "✗ $err"
                    tvScanStatus.setTextColor(
                        ContextCompat.getColor(this@OperatorDashboardActivity, R.color.status_cancelled)
                    )
                    Toast.makeText(this@OperatorDashboardActivity, err, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun showFinalizeConfirmation(reservationId: String) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Finalize Energy Transfer")
            .setMessage("Are you sure you want to finalize and complete the energy transfer for Reservation #$reservationId?")
            .setPositiveButton("Complete Transfer") { _, _ ->
                finalizeTransaction(reservationId)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun finalizeTransaction(reservationId: String) {
        val token = sessionManager.getToken()
        if (token.isNullOrEmpty()) {
            Toast.makeText(this, "Session expired, please log in again", Toast.LENGTH_SHORT).show()
            logout()
            return
        }

        btnFinalize.isEnabled = false
        btnFinalize.text = "Completing..."

        AppExecutors.executeInBackground {
            try {
                val url = URL(ApiClient.resolveUrl("api/transactions/$reservationId/complete"))
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.connectTimeout = 10000
                conn.readTimeout = 10000

                val responseCode = conn.responseCode
                if (responseCode == 200) {
                    runOnUiThread {
                        tvVerifiedStatus.text = "Completed"
                        tvVerifiedStatus.backgroundTintList = ColorStateList.valueOf(
                            ContextCompat.getColor(this@OperatorDashboardActivity, R.color.status_completed)
                        )
                        btnFinalize.isEnabled = false
                        btnFinalize.text = getString(R.string.operator_status_completed)
                        tvScanStatus.text = "✓ Energy Transfer Finalized and Completed!"
                        tvScanStatus.setTextColor(
                            ContextCompat.getColor(this@OperatorDashboardActivity, R.color.status_completed)
                        )
                        Toast.makeText(
                            this@OperatorDashboardActivity,
                            "Energy Transfer Completed Successfully!",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                } else {
                    val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
                    val errorMessage = try {
                        if (!errorBody.isNullOrBlank()) {
                            JSONObject(errorBody).optString("message", "Failed to complete transaction")
                        } else "Failed to complete transaction"
                    } catch (e: Exception) {
                        "Failed to complete transaction (HTTP $responseCode)"
                    }

                    runOnUiThread {
                        btnFinalize.isEnabled = true
                        btnFinalize.text = getString(R.string.operator_finalize_action)
                        Toast.makeText(this@OperatorDashboardActivity, errorMessage, Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    btnFinalize.isEnabled = true
                    btnFinalize.text = getString(R.string.operator_finalize_action)
                    val err = "Finalize failed: ${e.localizedMessage ?: "Connection error"}"
                    Toast.makeText(this@OperatorDashboardActivity, err, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun resetVerifiedCard() {
        activeReservationId = null
        cardVerifiedTransaction.visibility = View.GONE
        tvScanStatus.visibility = View.GONE
    }

    private fun logout() {
        AppExecutors.executeInBackground {
            sessionManager.clearSession()
            runOnUiThread {
                val intent = Intent(this, OperatorLoginActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                }
                startActivity(intent)
                finish()
            }
        }
    }
}
