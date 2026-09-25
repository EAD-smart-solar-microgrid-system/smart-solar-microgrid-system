package com.example.smartsolarmicrogridtradingsystem.feature.operatormode.ui
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStreamWriter

class OperatorLoginActivity : AppCompatActivity() {
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_operator_login)
        sessionManager = SessionManager(this)

        if (sessionManager.isLoggedIn() && sessionManager.getRole() == "GridOperator") {
            startActivity(Intent(this, OperatorDashboardActivity::class.java))
            finish()
            return
        }

        val btnLogin = findViewById<Button>(R.id.btnLogin)
        btnLogin.setOnClickListener {
            val username = findViewById<EditText>(R.id.etUsername).text.toString()
            val password = findViewById<EditText>(R.id.etPassword).text.toString()
            
            AppExecutors.executeInBackground {
                try {
                    val url = URL(ApiClient.resolveUrl("api/auth/login"))
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    val req = JSONObject().apply { put("username", username); put("password", password) }
                    OutputStreamWriter(conn.outputStream).use { it.write(req.toString()) }
                    
                    if (conn.responseCode == 200) {
                        val res = conn.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(res)
                        val role = json.optString("role", json.optInt("role", -1).toString())
                        if (role == "1" || role == "GridOperator") {
                            sessionManager.saveSession(json.getString("token"), username, "GridOperator")
                            runOnUiThread {
                                startActivity(Intent(this@OperatorLoginActivity, OperatorDashboardActivity::class.java))
                                finish()
                            }
                        } else {
                            runOnUiThread { Toast.makeText(this@OperatorLoginActivity, "Not an Operator", Toast.LENGTH_SHORT).show() }
                        }
                    } else {
                        runOnUiThread { Toast.makeText(this@OperatorLoginActivity, "Invalid credentials", Toast.LENGTH_SHORT).show() }
                    }
                } catch (e: Exception) {
                    runOnUiThread { Toast.makeText(this@OperatorLoginActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show() }
                }
            }
        }
    }
}
