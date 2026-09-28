package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.smartsolarmicrogridtradingsystem.MainActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerAuthResponseDto
import com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui.OperatorDashboardActivity
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.data.ProsumerAccountRepository
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import org.json.JSONObject

/**
 * Unified Login Activity supporting both Solar Prosumers and Grid Operators.
 * Implements role-based routing upon successful authentication:
 * - Prosumers -> Main App (Reservations, Dashboard, Profile)
 * - Grid Operators -> Operator Dashboard (QR scanner, transfer finalization)
 */
class AppLoginActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private val prosumerRepository = ProsumerAccountRepository.getInstance()

    private lateinit var btnTabProsumer: MaterialButton
    private lateinit var btnTabOperator: MaterialButton
    private lateinit var layoutProsumerLogin: LinearLayout
    private lateinit var layoutOperatorLogin: LinearLayout

    private lateinit var tilProsumerNic: TextInputLayout
    private lateinit var etProsumerNic: TextInputEditText
    private lateinit var btnProsumerLogin: MaterialButton

    private lateinit var tilOpUsername: TextInputLayout
    private lateinit var etOpUsername: TextInputEditText
    private lateinit var tilOpPassword: TextInputLayout
    private lateinit var etOpPassword: TextInputEditText
    private lateinit var btnOpLogin: MaterialButton

    private lateinit var tvLoginError: TextView
    private lateinit var pbLoginLoading: ProgressBar
    private lateinit var tvToRegister: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_app_login)

        sessionManager = SessionManager(this)

        // Check if already authenticated and redirect accordingly
        if (sessionManager.isLoggedIn()) {
            val role = sessionManager.getRole()
            if (role == "GridOperator") {
                startActivity(Intent(this, OperatorDashboardActivity::class.java))
                finish()
                return
            } else if (role == "Prosumer") {
                startActivity(Intent(this, MainActivity::class.java))
                finish()
                return
            }
        }

        initViews()
        setupTabSwitching()
        setupProsumerLogin()
        setupOperatorLogin()

        tvToRegister.setOnClickListener {
            startActivity(Intent(this, ProsumerRegisterActivity::class.java))
        }
    }

    private fun initViews() {
        btnTabProsumer = findViewById(R.id.btnTabProsumer)
        btnTabOperator = findViewById(R.id.btnTabOperator)
        layoutProsumerLogin = findViewById(R.id.layoutProsumerLogin)
        layoutOperatorLogin = findViewById(R.id.layoutOperatorLogin)

        tilProsumerNic = findViewById(R.id.tilProsumerNic)
        etProsumerNic = findViewById(R.id.etProsumerNic)
        btnProsumerLogin = findViewById(R.id.btnProsumerLogin)

        tilOpUsername = findViewById(R.id.tilOpUsername)
        etOpUsername = findViewById(R.id.etOpUsername)
        tilOpPassword = findViewById(R.id.tilOpPassword)
        etOpPassword = findViewById(R.id.etOpPassword)
        btnOpLogin = findViewById(R.id.btnOpLogin)

        tvLoginError = findViewById(R.id.tvLoginError)
        pbLoginLoading = findViewById(R.id.pbLoginLoading)
        tvToRegister = findViewById(R.id.tvToRegister)
    }

    private fun setupTabSwitching() {
        btnTabProsumer.setOnClickListener {
            btnTabProsumer.setBackgroundColor(getColor(R.color.color_primary_container))
            btnTabOperator.setBackgroundColor(getColor(android.R.color.transparent))
            layoutProsumerLogin.visibility = View.VISIBLE
            layoutOperatorLogin.visibility = View.GONE
            tvLoginError.visibility = View.GONE
        }

        btnTabOperator.setOnClickListener {
            btnTabOperator.setBackgroundColor(getColor(R.color.color_primary_container))
            btnTabProsumer.setBackgroundColor(getColor(android.R.color.transparent))
            layoutOperatorLogin.visibility = View.VISIBLE
            layoutProsumerLogin.visibility = View.GONE
            tvLoginError.visibility = View.GONE
        }
    }

    private fun setupProsumerLogin() {
        btnProsumerLogin.setOnClickListener {
            val nic = etProsumerNic.text?.toString()?.trim().orEmpty()
            tilProsumerNic.error = null
            tvLoginError.visibility = View.GONE

            if (nic.isEmpty()) {
                tilProsumerNic.error = "NIC is required"
                return@setOnClickListener
            }

            setLoading(true)
            prosumerRepository.loginProsumer(nic, object : ApiCallback<ProsumerAuthResponseDto> {
                override fun onSuccess(result: NetworkResult.Success<ProsumerAuthResponseDto>) {
                    setLoading(false)
                    val auth = result.responseBody

                    // Persist session to local SQLite database
                    sessionManager.saveSession(
                        token = auth.token,
                        userIdentifier = auth.nic,
                        role = "Prosumer"
                    )

                    // Role-based route to Prosumer home
                    val intent = Intent(this@AppLoginActivity, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    }
                    startActivity(intent)
                    finish()
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    setLoading(false)
                    val errorMsg = ProsumerAccountRepository.extractErrorMessage(error)
                    tvLoginError.text = errorMsg
                    tvLoginError.visibility = View.VISIBLE
                }
            })
        }
    }

    private fun setupOperatorLogin() {
        btnOpLogin.setOnClickListener {
            val username = etOpUsername.text?.toString()?.trim().orEmpty()
            val password = etOpPassword.text?.toString()?.trim().orEmpty()

            tilOpUsername.error = null
            tilOpPassword.error = null
            tvLoginError.visibility = View.GONE

            if (username.isEmpty()) {
                tilOpUsername.error = "Username is required"
                return@setOnClickListener
            }
            if (password.isEmpty()) {
                tilOpPassword.error = "Password is required"
                return@setOnClickListener
            }

            setLoading(true)
            val payload = JSONObject().apply {
                put("username", username)
                put("password", password)
            }

            ApiClient.sendRequest(
                method = HttpMethod.POST,
                endpoint = "auth/login",
                requestBody = payload,
                callback = object : ApiCallback<String> {
                    override fun onSuccess(result: NetworkResult.Success<String>) {
                        setLoading(false)
                        try {
                            val json = JSONObject(result.responseBody)
                            val token = json.getString("token")
                            val user = json.getString("username")
                            val role = json.optString("role", "GridOperator")

                            // Persist session in local SQLite database
                            sessionManager.saveSession(token, user, role)

                            // Role-based route to Operator Dashboard
                            val intent = Intent(this@AppLoginActivity, OperatorDashboardActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            }
                            startActivity(intent)
                            finish()
                        } catch (e: Exception) {
                            tvLoginError.text = "Failed to parse operator authentication response."
                            tvLoginError.visibility = View.VISIBLE
                        }
                    }

                    override fun onError(error: NetworkResult<Nothing>) {
                        setLoading(false)
                        tvLoginError.text = ProsumerAccountRepository.extractErrorMessage(error)
                        tvLoginError.visibility = View.VISIBLE
                    }
                }
            )
        }
    }

    private fun setLoading(loading: Boolean) {
        pbLoginLoading.visibility = if (loading) View.VISIBLE else View.GONE
        btnProsumerLogin.isEnabled = !loading
        btnOpLogin.isEnabled = !loading
    }
}
