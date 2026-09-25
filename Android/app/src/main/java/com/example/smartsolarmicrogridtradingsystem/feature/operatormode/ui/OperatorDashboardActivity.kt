package com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStreamWriter
import android.app.AlertDialog

class OperatorDashboardActivity : AppCompatActivity() {
    private lateinit var sessionManager: SessionManager

    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result ->
        if (result.contents == null) {
            Toast.makeText(this, "Scan cancelled", Toast.LENGTH_LONG).show()
        } else {
            verifyQrToken(result.contents)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_operator_dashboard)
        sessionManager = SessionManager(this)

        findViewById<Button>(R.id.btnScanQr).setOnClickListener {
            val options = ScanOptions().apply {
                setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                setPrompt("Scan Prosumer's QR Code")
                setCameraId(0)
                setBeepEnabled(false)
                setBarcodeImageEnabled(true)
            }
            barcodeLauncher.launch(options)
        }
        
        findViewById<Button>(R.id.btnLogout).setOnClickListener {
            AppExecutors.executeInBackground {
                sessionManager.clearSession()
                runOnUiThread {
                    startActivity(Intent(this, OperatorLoginActivity::class.java))
                    finish()
                }
            }
        }
    }

    private fun verifyQrToken(qrToken: String) {
        val token = sessionManager.getToken() ?: return
        AppExecutors.executeInBackground {
            try {
                val url = URL(ApiClient.resolveUrl("api/Transactions/verify-qr"))
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true
                val req = JSONObject().apply { put("qrToken", qrToken) }
                OutputStreamWriter(conn.outputStream).use { it.write(req.toString()) }
                
                if (conn.responseCode == 200) {
                    val res = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(res)
                    val resId = json.getString("reservationId")
                    runOnUiThread { showFinalizeDialog(resId) }
                } else {
                    runOnUiThread { Toast.makeText(this@OperatorDashboardActivity, "Invalid QR Code", Toast.LENGTH_SHORT).show() }
                }
            } catch (e: Exception) {
                runOnUiThread { Toast.makeText(this@OperatorDashboardActivity, "Error verifying", Toast.LENGTH_SHORT).show() }
            }
        }
    }

    private fun showFinalizeDialog(reservationId: String) {
        AlertDialog.Builder(this)
            .setTitle("Transaction Verified")
            .setMessage("The energy transfer is verified. Finalize it?")
            .setPositiveButton("Complete Transaction") { _, _ -> finalizeTransaction(reservationId) }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun finalizeTransaction(reservationId: String) {
        val token = sessionManager.getToken() ?: return
        AppExecutors.executeInBackground {
            try {
                val url = URL(ApiClient.resolveUrl("api/Transactions/$reservationId/complete"))
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Authorization", "Bearer $token")
                if (conn.responseCode == 200) {
                    runOnUiThread { Toast.makeText(this@OperatorDashboardActivity, "Energy Transfer Completed!", Toast.LENGTH_LONG).show() }
                } else {
                    runOnUiThread { Toast.makeText(this@OperatorDashboardActivity, "Failed to complete", Toast.LENGTH_SHORT).show() }
                }
            } catch (e: Exception) {
                runOnUiThread { Toast.makeText(this@OperatorDashboardActivity, "Error", Toast.LENGTH_SHORT).show() }
            }
        }
    }
}
