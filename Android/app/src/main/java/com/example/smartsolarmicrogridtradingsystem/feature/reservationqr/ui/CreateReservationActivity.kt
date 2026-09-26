package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.text.format.DateFormat
import android.view.View
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.ProgressBar
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardUiFormatter
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationLocalRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.StationSlotRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.CreateReservationRequest
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationType
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.StationSlotDto
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.radiobutton.MaterialRadioButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Member 2 activity for scheduling a new solar microgrid energy slot reservation.
 * Connects to Member 4 station & slot APIs, validates input against 7-day future booking rules,
 * sends POST /api/reservations via [ReservationRepository], and writes successful results to [ReservationLocalRepository].
 */
class CreateReservationActivity : BaseActivity() {

    companion object {
        const val EXTRA_PROSUMER_NIC = "EXTRA_PROSUMER_NIC"
    }

    private lateinit var sessionManager: SessionManager
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var stationSlotRepository: StationSlotRepository
    private lateinit var localRepository: ReservationLocalRepository

    private lateinit var tilProsumerNic: TextInputLayout
    private lateinit var etProsumerNic: TextInputEditText
    private lateinit var tilStation: TextInputLayout
    private lateinit var actvStation: AutoCompleteTextView
    private lateinit var tilSlot: TextInputLayout
    private lateinit var actvSlot: AutoCompleteTextView
    private lateinit var tilReservationDate: TextInputLayout
    private lateinit var etReservationDate: TextInputEditText
    private lateinit var tilReservationTime: TextInputLayout
    private lateinit var etReservationTime: TextInputEditText
    private lateinit var rgReservationType: RadioGroup
    private lateinit var rbTypeDropOff: MaterialRadioButton
    private lateinit var rbTypeCharging: MaterialRadioButton
    private lateinit var tvCreateError: TextView
    private lateinit var progressCreate: ProgressBar
    private lateinit var btnSubmit: MaterialButton

    private var availableStations: List<StationReferenceDto> = emptyList()
    private var availableSlots: List<StationSlotDto> = emptyList()
    private var selectedStation: StationReferenceDto? = null
    private var selectedSlot: StationSlotDto? = null

    private val selectedCalendar: Calendar = Calendar.getInstance()
    private var isDateSelected: Boolean = false
    private var isTimeSelected: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_reservation)

        val root = findViewById<View>(R.id.createReservationRoot)
        if (root != null) {
            setupSystemBarPadding(root)
        }

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarCreateReservation)
        toolbar.setNavigationOnClickListener {
            finish()
        }

        sessionManager = SessionManager(this)
        reservationRepository = ReservationRepository.getInstance()
        stationSlotRepository = StationSlotRepository()
        localRepository = ReservationLocalRepository.getInstance(this)

        initViews()
        setupListeners()
        populateInitialNic()
        loadStations()
    }

    private fun initViews() {
        tilProsumerNic = findViewById(R.id.tilCreateProsumerNic)
        etProsumerNic = findViewById(R.id.etCreateProsumerNic)
        tilStation = findViewById(R.id.tilStation)
        actvStation = findViewById(R.id.actvStation)
        tilSlot = findViewById(R.id.tilSlot)
        actvSlot = findViewById(R.id.actvSlot)
        tilReservationDate = findViewById(R.id.tilReservationDate)
        etReservationDate = findViewById(R.id.etReservationDate)
        tilReservationTime = findViewById(R.id.tilReservationTime)
        etReservationTime = findViewById(R.id.etReservationTime)
        rgReservationType = findViewById(R.id.rgReservationType)
        rbTypeDropOff = findViewById(R.id.rbTypeDropOff)
        rbTypeCharging = findViewById(R.id.rbTypeCharging)
        tvCreateError = findViewById(R.id.tvCreateError)
        progressCreate = findViewById(R.id.progressCreateReservation)
        btnSubmit = findViewById(R.id.btnSubmitReservation)
    }

    private fun setupListeners() {
        etReservationDate.setOnClickListener { showDatePicker() }
        tilReservationDate.setOnClickListener { showDatePicker() }

        etReservationTime.setOnClickListener { showTimePicker() }
        tilReservationTime.setOnClickListener { showTimePicker() }

        actvStation.setOnClickListener {
            if (availableStations.isNotEmpty()) {
                actvStation.showDropDown()
            }
        }

        actvSlot.setOnClickListener {
            if (selectedStation != null && availableSlots.isNotEmpty()) {
                actvSlot.showDropDown()
            }
        }

        btnSubmit.setOnClickListener {
            submitReservation()
        }
    }

    private fun populateInitialNic() {
        val passedNic = intent.getStringExtra(EXTRA_PROSUMER_NIC)?.trim()
        val sessionNic = sessionManager.getUserIdentifier()?.trim()
        val initialNic = if (!passedNic.isNullOrBlank()) passedNic else sessionNic
        if (!initialNic.isNullOrBlank()) {
            etProsumerNic.setText(initialNic)
        }
    }

    private fun loadStations() {
        tilStation.hint = getString(R.string.msg_loading_stations)
        tilStation.isEnabled = false

        stationSlotRepository.getStations(
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<List<StationReferenceDto>> {
                override fun onSuccess(result: NetworkResult.Success<List<StationReferenceDto>>) {
                    val stationsPayload: List<StationReferenceDto> = result.responseBody
                    val activeStations: List<StationReferenceDto> = stationsPayload.filter { station ->
                        station.status.isBlank() || station.status.equals("Active", ignoreCase = true)
                    }

                    if (activeStations.isEmpty()) {
                        tilStation.hint = getString(R.string.msg_no_stations_available)
                        tilStation.isEnabled = false
                        return
                    }

                    availableStations = activeStations
                    tilStation.hint = getString(R.string.hint_station)
                    tilStation.isEnabled = true

                    val stationLabels: List<String> = activeStations.map { station: StationReferenceDto ->
                        val name = station.name.ifBlank { "Station " + DashboardUiFormatter.shortenId(station.id) }
                        "$name (${DashboardUiFormatter.shortenId(station.id)})"
                    }

                    val adapter = ArrayAdapter(
                        this@CreateReservationActivity,
                        android.R.layout.simple_dropdown_item_1line,
                        stationLabels
                    )
                    actvStation.setAdapter(adapter)

                    actvStation.setOnItemClickListener { _, _, position, _ ->
                        if (position in activeStations.indices) {
                            val picked = activeStations[position]
                            if (selectedStation?.id != picked.id) {
                                selectedStation = picked
                                tilStation.error = null
                                onStationSelected(picked)
                            }
                        }
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    tilStation.isEnabled = true
                    tilStation.hint = getString(R.string.hint_station)
                    tilStation.error = ReservationRepository.extractErrorMessage(error)
                }
            }
        )
    }

    private fun onStationSelected(station: StationReferenceDto) {
        selectedSlot = null
        actvSlot.setText("", false)
        tilSlot.error = null
        tilSlot.isEnabled = false
        tilSlot.hint = getString(R.string.msg_loading_slots)

        stationSlotRepository.getStationSlots(
            stationId = station.id,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<List<StationSlotDto>> {
                override fun onSuccess(result: NetworkResult.Success<List<StationSlotDto>>) {
                    val slotsPayload: List<StationSlotDto> = result.responseBody
                    val selectableSlots: List<StationSlotDto> = slotsPayload.filter { slot -> slot.isAvailable }

                    if (selectableSlots.isEmpty()) {
                        tilSlot.isEnabled = false
                        tilSlot.hint = getString(R.string.msg_no_slots_available)
                        availableSlots = emptyList()
                        return
                    }

                    availableSlots = selectableSlots
                    tilSlot.hint = getString(R.string.hint_slot)
                    tilSlot.isEnabled = true

                    val slotLabels: List<String> = selectableSlots.map { slot: StationSlotDto ->
                        val startFormatted = DashboardUiFormatter.formatDateTime(slot.slotStartUtc)
                        "Slot ${DashboardUiFormatter.shortenId(slot.id)} · $startFormatted (${slot.capacityKw} kW)"
                    }

                    val adapter = ArrayAdapter(
                        this@CreateReservationActivity,
                        android.R.layout.simple_dropdown_item_1line,
                        slotLabels
                    )
                    actvSlot.setAdapter(adapter)

                    actvSlot.setOnItemClickListener { _, _, position, _ ->
                        if (position in selectableSlots.indices) {
                            selectedSlot = selectableSlots[position]
                            tilSlot.error = null
                        }
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    tilSlot.isEnabled = false
                    tilSlot.hint = getString(R.string.hint_slot)
                    tilSlot.error = ReservationRepository.extractErrorMessage(error)
                }
            }
        )
    }

    private fun showDatePicker() {
        val currentYear = selectedCalendar.get(Calendar.YEAR)
        val currentMonth = selectedCalendar.get(Calendar.MONTH)
        val currentDay = selectedCalendar.get(Calendar.DAY_OF_MONTH)

        val datePickerDialog = DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                selectedCalendar.set(Calendar.YEAR, year)
                selectedCalendar.set(Calendar.MONTH, month)
                selectedCalendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
                isDateSelected = true

                val displayFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                etReservationDate.setText(displayFormat.format(selectedCalendar.time))
                tilReservationDate.error = null
            },
            currentYear,
            currentMonth,
            currentDay
        )

        // Enforce backend rolling 7-day future window on the picker widget
        val nowMs = System.currentTimeMillis()
        datePickerDialog.datePicker.minDate = nowMs
        datePickerDialog.datePicker.maxDate = nowMs + (7L * 24 * 60 * 60 * 1000)

        datePickerDialog.show()
    }

    private fun showTimePicker() {
        val currentHour = selectedCalendar.get(Calendar.HOUR_OF_DAY)
        val currentMinute = selectedCalendar.get(Calendar.MINUTE)

        val timePickerDialog = TimePickerDialog(
            this,
            { _, hourOfDay, minute ->
                selectedCalendar.set(Calendar.HOUR_OF_DAY, hourOfDay)
                selectedCalendar.set(Calendar.MINUTE, minute)
                selectedCalendar.set(Calendar.SECOND, 0)
                selectedCalendar.set(Calendar.MILLISECOND, 0)
                isTimeSelected = true

                val displayFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                etReservationTime.setText(displayFormat.format(selectedCalendar.time))
                tilReservationTime.error = null
            },
            currentHour,
            currentMinute,
            DateFormat.is24HourFormat(this)
        )

        timePickerDialog.show()
    }

    private fun submitReservation() {
        tilProsumerNic.error = null
        tilStation.error = null
        tilSlot.error = null
        tilReservationDate.error = null
        tilReservationTime.error = null
        tvCreateError.visibility = View.GONE

        val nic = etProsumerNic.text?.toString()?.trim().orEmpty()
        if (nic.isEmpty()) {
            tilProsumerNic.error = getString(R.string.reservation_nic_required_prompt)
            tilProsumerNic.requestFocus()
            return
        }

        val station = selectedStation
        if (station == null) {
            tilStation.error = getString(R.string.error_station_required)
            return
        }

        val slot = selectedSlot
        if (slot == null) {
            tilSlot.error = getString(R.string.error_slot_required)
            return
        }

        if (!isDateSelected) {
            tilReservationDate.error = getString(R.string.error_date_time_required)
            return
        }

        if (!isTimeSelected) {
            tilReservationTime.error = getString(R.string.error_date_time_required)
            return
        }

        val now = Calendar.getInstance()
        if (!selectedCalendar.after(now)) {
            tilReservationTime.error = getString(R.string.error_date_time_future)
            return
        }

        val maxForwardWindow = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 7)
        }
        if (selectedCalendar.after(maxForwardWindow)) {
            tilReservationDate.error = getString(R.string.error_date_time_7_days)
            return
        }

        val reservationType = if (rbTypeCharging.isChecked) {
            ReservationType.CHARGING.apiValue
        } else {
            ReservationType.DROP_OFF.apiValue
        }

        val utcFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val reservationDateTime = utcFormat.format(selectedCalendar.time)

        val request = CreateReservationRequest(
            prosumerNic = nic,
            stationId = station.id,
            slotId = slot.id,
            reservationDateTime = reservationDateTime,
            reservationType = reservationType
        )

        btnSubmit.isEnabled = false
        progressCreate.visibility = View.VISIBLE

        reservationRepository.createReservation(
            request = request,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<ReservationDto> {
                override fun onSuccess(result: NetworkResult.Success<ReservationDto>) {
                    val dto = result.responseBody
                    AppExecutors.executeInBackground {
                        val rowId = try {
                            localRepository.upsert(dto)
                        } catch (_: Exception) {
                            -1L
                        }

                        AppExecutors.executeOnMainThread {
                            if (rowId != -1L) {
                                // 1. SQLite operation confirmed successful BEFORE UI completion
                                Toast.makeText(
                                    this@CreateReservationActivity,
                                    R.string.msg_reservation_created,
                                    Toast.LENGTH_SHORT
                                ).show()
                                setResult(RESULT_OK)
                                finish()
                            } else {
                                // 2. SQLite operation failed: do not report cached, do not finish, prevent re-submitting
                                progressCreate.visibility = View.GONE
                                btnSubmit.isEnabled = false
                                val errorMsg = getString(
                                    R.string.error_reservation_cache_failed,
                                    DashboardUiFormatter.shortenId(dto.id)
                                )
                                tvCreateError.text = errorMsg
                                tvCreateError.visibility = View.VISIBLE
                                Toast.makeText(
                                    this@CreateReservationActivity,
                                    errorMsg,
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    btnSubmit.isEnabled = true
                    progressCreate.visibility = View.GONE
                    val message = ReservationRepository.extractErrorMessage(error)
                    tvCreateError.text = message
                    tvCreateError.visibility = View.VISIBLE
                }
            }
        )
    }
}
