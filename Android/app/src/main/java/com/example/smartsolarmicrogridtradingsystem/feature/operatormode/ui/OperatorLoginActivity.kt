package com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class OperatorLoginActivity : AppCompatActivity() {
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_operator_login)
        sessionManager = SessionManager(this)

        // Toolbar back navigation
        findViewById<MaterialToolbar>(R.id.toolbarOperatorLogin).setNavigationOnClickListener {
            finish()
        }

        // Auto-navigate if already authenticated as GridOperator
        if (sessionManager.isLoggedIn() && sessionManager.getRole() == "GridOperator") {
            startActivity(Intent(this, OperatorDashboardActivity::class.java))
            finish()
            return
        }

        val tilUsername = findViewById<TextInputLayout>(R.id.tilUsername)
        val etUsername = findViewById<TextInputEditText>(R.id.etUsername)
        val tilPassword = findViewById<TextInputLayout>(R.id.tilPassword)
        val etPassword = findViewById<TextInputEditText>(R.id.etPassword)
        val tvLoginError = findViewById<TextView>(R.id.tvLoginError)
        val pbLoginLoading = findViewById<ProgressBar>(R.id.pbLoginLoading)
        val btnLogin = findViewById<MaterialButton>(R.id.btnLogin)

        btnLogin.setOnClickListener {
            val username = etUsername.text?.toString()?.trim().orEmpty()
            val password = etPassword.text?.toString()?.trim().orEmpty()

            tilUsername.error = null
            tilPassword.error = null
            tvLoginError.visibility = View.GONE

            if (username.isEmpty()) {
                tilUsername.error = "Username is required"
                etUsername.requestFocus()
                return@setOnClickListener
            }

            if (password.isEmpty()) {
                tilPassword.error = "Password is required"
                etPassword.requestFocus()
                return@setOnClickListener
            }

            btnLogin.isEnabled = false
            pbLoginLoading.visibility = View.VISIBLE

            AppExecutors.executeInBackground {
                try {
                    val url = URL(ApiClient.resolveUrl("api/auth/login"))
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.connectTimeout = 10000
                    conn.readTimeout = 10000
                    conn.doOutput = true

                    val req = JSONObject().apply {
                        put("username", username)
                        put("password", password)
                    }
                    OutputStreamWriter(conn.outputStream).use { it.write(req.toString()) }

                    val responseCode = conn.responseCode
                    if (responseCode == 200) {
                        val res = conn.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(res)
                        val token = json.getString("token")
                        val role = json.optString("role", json.optInt("role", -1).toString())

                        // Role 1 is GridOperator (or "GridOperator" string)
                        if (role == "1" || role.equals("GridOperator", ignoreCase = true)) {
                            sessionManager.saveSession(token, username, "GridOperator")
                            runOnUiThread {
                                Toast.makeText(this@OperatorLoginActivity, "Operator login successful", Toast.LENGTH_SHORT).show()
                                startActivity(Intent(this@OperatorLoginActivity, OperatorDashboardActivity::class.java))
                                finish()
                            }
                        } else {
                            runOnUiThread {
                                pbLoginLoading.visibility = View.GONE
                                btnLogin.isEnabled = true
                                tvLoginError.text = "Access denied: Only Grid Operator accounts can access Operator Mode."
                                tvLoginError.visibility = View.VISIBLE
                            }
                        }
                    } else {
                        val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
                        val errorMessage = try {
                            if (!errorBody.isNullOrBlank()) {
                                JSONObject(errorBody).optString("message", "Invalid username or password.")
                            } else "Invalid username or password."
                        } catch (e: Exception) {
                            "Invalid credentials (HTTP $responseCode)"
                        }
                        runOnUiThread {
                            pbLoginLoading.visibility = View.GONE
                            btnLogin.isEnabled = true
                            tvLoginError.text = errorMessage
                            tvLoginError.visibility = View.VISIBLE
                        }
                    }
                } catch (e: Exception) {
                    runOnUiThread {
                        pbLoginLoading.visibility = View.GONE
                        btnLogin.isEnabled = true
                        tvLoginError.text = "Connection failed: ${e.localizedMessage ?: "Unable to connect to server."}"
                        tvLoginError.visibility = View.VISIBLE
                    }
                }
            }
        }
    }
}
