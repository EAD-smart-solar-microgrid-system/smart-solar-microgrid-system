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
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardUiFormatter
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationLocalRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.StationSlotRepository
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationStatus
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationType
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.StationSlotDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.UpdateReservationRequest
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.util.ReservationTimeHelper
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.radiobutton.MaterialRadioButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * Member 2 activity for modifying a scheduled energy slot reservation via PUT /api/reservations/{id}.
 * Station remains fixed. Allows slot reassignment, future date/time reschedule within 7 days,
 * and transfer type adjustments subject to the 12-hour advance notice policy.
 */
class EditReservationActivity : BaseActivity() {

    companion object {
        const val EXTRA_RESERVATION_ID = "EXTRA_RESERVATION_ID"
        const val EXTRA_PROSUMER_NIC = "EXTRA_PROSUMER_NIC"
    }

    private lateinit var sessionManager: SessionManager
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var stationSlotRepository: StationSlotRepository
    private lateinit var localRepository: ReservationLocalRepository

    private lateinit var etProsumerNic: TextInputEditText
    private lateinit var etStation: TextInputEditText
    private lateinit var tilSlot: TextInputLayout
    private lateinit var actvSlot: AutoCompleteTextView
    private lateinit var tilDate: TextInputLayout
    private lateinit var etDate: TextInputEditText
    private lateinit var tilTime: TextInputLayout
    private lateinit var etTime: TextInputEditText
    private lateinit var rgType: RadioGroup
    private lateinit var rbTypeDropOff: MaterialRadioButton
    private lateinit var rbTypeCharging: MaterialRadioButton
    private lateinit var tvError: TextView
    private lateinit var progress: ProgressBar
    private lateinit var btnSubmit: MaterialButton

    private var reservationId: String = ""
    private var existingReservation: ReservationDto? = null
    private var selectedSlotId: String = ""
    private var availableSlots: List<StationSlotDto> = emptyList()

    private val selectedCalendar: Calendar = Calendar.getInstance()
    private var isDateSelected: Boolean = false
    private var isTimeSelected: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_edit_reservation)

        val root = findViewById<View>(R.id.editReservationRoot)
        if (root != null) {
            setupSystemBarPadding(root)
        }

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarEditReservation)
        toolbar.setNavigationOnClickListener {
            finish()
        }

        sessionManager = SessionManager(this)
        reservationRepository = ReservationRepository.getInstance()
        stationSlotRepository = StationSlotRepository()
        localRepository = ReservationLocalRepository.getInstance(this)

        initViews()
        setupListeners()

        reservationId = intent.getStringExtra(EXTRA_RESERVATION_ID)?.trim().orEmpty()
        if (reservationId.isEmpty()) {
            Toast.makeText(this, R.string.error_reservation_not_found, Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        loadExistingReservation()
    }

    private fun initViews() {
        etProsumerNic = findViewById(R.id.etEditProsumerNic)
        etStation = findViewById(R.id.etEditStation)
        tilSlot = findViewById(R.id.tilEditSlot)
        actvSlot = findViewById(R.id.actvEditSlot)
        tilDate = findViewById(R.id.tilEditReservationDate)
        etDate = findViewById(R.id.etEditReservationDate)
        tilTime = findViewById(R.id.tilEditReservationTime)
        etTime = findViewById(R.id.etEditReservationTime)
        rgType = findViewById(R.id.rgEditReservationType)
        rbTypeDropOff = findViewById(R.id.rbEditTypeDropOff)
        rbTypeCharging = findViewById(R.id.rbEditTypeCharging)
        tvError = findViewById(R.id.tvEditError)
        progress = findViewById(R.id.progressEditReservation)
        btnSubmit = findViewById(R.id.btnSubmitUpdate)
    }

    private fun setupListeners() {
        etDate.setOnClickListener { showDatePicker() }
        tilDate.setOnClickListener { showDatePicker() }

        etTime.setOnClickListener { showTimePicker() }
        tilTime.setOnClickListener { showTimePicker() }

        actvSlot.setOnClickListener {
            if (availableSlots.isNotEmpty()) {
                actvSlot.showDropDown()
            }
        }

        btnSubmit.setOnClickListener {
            submitUpdate()
        }
    }

    private fun loadExistingReservation() {
        progress.visibility = View.VISIBLE
        btnSubmit.isEnabled = false

        AppExecutors.executeInBackground {
            val record = localRepository.getById(reservationId)

            AppExecutors.executeOnMainThread {
                progress.visibility = View.GONE

                if (record == null) {
                    Toast.makeText(this@EditReservationActivity, R.string.error_reservation_not_found, Toast.LENGTH_SHORT).show()
                    finish()
                    return@executeOnMainThread
                }

                // Security / scoping check against session or intent context
                val expectedNic = intent.getStringExtra(EXTRA_PROSUMER_NIC)?.trim()
                    ?: sessionManager.getUserIdentifier()?.trim()

                if (!expectedNic.isNullOrBlank() && !record.prosumerNic.equals(expectedNic, ignoreCase = true)) {
                    Toast.makeText(this@EditReservationActivity, R.string.error_reservation_unauthorized, Toast.LENGTH_SHORT).show()
                    finish()
                    return@executeOnMainThread
                }

                existingReservation = record
                bindExistingRecord(record)
            }
        }
    }

    private fun bindExistingRecord(record: ReservationDto) {
        etProsumerNic.setText(record.prosumerNic)
        etStation.setText(DashboardUiFormatter.shortenId(record.stationId))
        selectedSlotId = record.slotId

        // Check if modification is permitted under the 12-hour rule
        val canModify = record.parsedStatus != ReservationStatus.CANCELLED
                && record.parsedStatus != ReservationStatus.COMPLETED
                && ReservationTimeHelper.hasTwelveHoursNotice(record.reservationDateTime)

        if (!canModify) {
            btnSubmit.isEnabled = false
            tvError.text = getString(R.string.error_edit_twelve_hours)
            tvError.visibility = View.VISIBLE
        } else {
            btnSubmit.isEnabled = true
        }

        // Parse scheduled time
        val parsedDate = ReservationTimeHelper.parseUtcInstant(record.reservationDateTime)
        if (parsedDate != null) {
            selectedCalendar.time = parsedDate
            isDateSelected = true
            isTimeSelected = true

            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
            etDate.setText(dateFormat.format(parsedDate))
            etTime.setText(timeFormat.format(parsedDate))
        }

        // Bind type
        if (record.parsedType == ReservationType.CHARGING) {
            rbTypeCharging.isChecked = true
        } else {
            rbTypeDropOff.isChecked = true
        }

        // Set initial slot display
        actvSlot.setText("Slot ${DashboardUiFormatter.shortenId(record.slotId)} (Current)", false)

        loadAvailableSlots(record.stationId, record.slotId)
    }

    private fun loadAvailableSlots(stationId: String, currentSlotId: String) {
        tilSlot.hint = getString(R.string.msg_loading_slots)
        tilSlot.isEnabled = false

        stationSlotRepository.getStationSlots(
            stationId = stationId,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<List<StationSlotDto>> {
                override fun onSuccess(result: NetworkResult.Success<List<StationSlotDto>>) {
                    val selectableSlots = result.responseBody.filter { it.isAvailable }
                    availableSlots = selectableSlots
                    tilSlot.isEnabled = true
                    tilSlot.hint = getString(R.string.hint_slot)

                    val slotLabels = mutableListOf<String>()
                    val slotIdList = mutableListOf<String>()

                    // Always keep existing slot as an option
                    slotLabels.add("Slot ${DashboardUiFormatter.shortenId(currentSlotId)} (Current)")
                    slotIdList.add(currentSlotId)

                    for (slot in selectableSlots) {
                        if (slot.id != currentSlotId) {
                            val startFormatted = DashboardUiFormatter.formatDateTime(slot.slotStartUtc)
                            slotLabels.add("Slot ${DashboardUiFormatter.shortenId(slot.id)} · $startFormatted (${slot.capacityKw} kW)")
                            slotIdList.add(slot.id)
                        }
                    }

                    val adapter = ArrayAdapter(
                        this@EditReservationActivity,
                        android.R.layout.simple_dropdown_item_1line,
                        slotLabels
                    )
                    actvSlot.setAdapter(adapter)

                    actvSlot.setOnItemClickListener { _, _, position, _ ->
                        if (position in slotIdList.indices) {
                            selectedSlotId = slotIdList[position]
                            tilSlot.error = null
                        }
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    tilSlot.isEnabled = true
                    tilSlot.hint = getString(R.string.hint_slot)
                    // If slot query fails, user can still retain their current slot
                    actvSlot.setText("Slot ${DashboardUiFormatter.shortenId(currentSlotId)} (Current)", false)
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
                etDate.setText(displayFormat.format(selectedCalendar.time))
                tilDate.error = null
            },
            currentYear,
            currentMonth,
            currentDay
        )

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
                etTime.setText(displayFormat.format(selectedCalendar.time))
                tilTime.error = null
            },
            currentHour,
            currentMinute,
            DateFormat.is24HourFormat(this)
        )
        timePickerDialog.show()
    }

    private fun submitUpdate() {
        tilSlot.error = null
        tilDate.error = null
        tilTime.error = null
        tvError.visibility = View.GONE

        val record = existingReservation ?: return

        // 12-hour rule check on existing reservation time
        if (!ReservationTimeHelper.hasTwelveHoursNotice(record.reservationDateTime)) {
            tvError.text = getString(R.string.error_edit_twelve_hours)
            tvError.visibility = View.VISIBLE
            return
        }

        if (!isDateSelected || !isTimeSelected) {
            tilDate.error = getString(R.string.error_date_time_required)
            return
        }

        val now = Calendar.getInstance()
        if (!selectedCalendar.after(now)) {
            tilTime.error = getString(R.string.error_date_time_future)
            return
        }

        val maxForwardWindow = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 7)
        }
        if (selectedCalendar.after(maxForwardWindow)) {
            tilDate.error = getString(R.string.error_date_time_7_days)
            return
        }

        val newReservationType = if (rbTypeCharging.isChecked) {
            ReservationType.CHARGING.apiValue
        } else {
            ReservationType.DROP_OFF.apiValue
        }

        val updatedDateTimeUtc = ReservationTimeHelper.toIsoUtcString(selectedCalendar.time)

        val request = UpdateReservationRequest(
            reservationDateTime = updatedDateTimeUtc,
            slotId = selectedSlotId.ifBlank { null },
            reservationType = newReservationType
        )

        btnSubmit.isEnabled = false
        progress.visibility = View.VISIBLE

        reservationRepository.updateReservation(
            id = record.id,
            request = request,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<ReservationDto> {
                override fun onSuccess(result: NetworkResult.Success<ReservationDto>) {
                    val dto = result.responseBody

                    // Execute SQLite write and verify before completing UI
                    AppExecutors.executeInBackground {
                        val rowId = try {
                            localRepository.upsert(dto)
                        } catch (_: Exception) {
                            -1L
                        }

                        AppExecutors.executeOnMainThread {
                            if (rowId != -1L) {
                                Toast.makeText(
                                    this@EditReservationActivity,
                                    R.string.msg_reservation_updated,
                                    Toast.LENGTH_SHORT
                                ).show()
                                setResult(RESULT_OK)
                                finish()
                            } else {
                                progress.visibility = View.GONE
                                btnSubmit.isEnabled = false
                                tvError.text = getString(R.string.error_reservation_update_cache_failed)
                                tvError.visibility = View.VISIBLE
                                Toast.makeText(
                                    this@EditReservationActivity,
                                    R.string.error_reservation_update_cache_failed,
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    btnSubmit.isEnabled = true
                    progress.visibility = View.GONE
                    val message = ReservationRepository.extractErrorMessage(error)
                    tvError.text = message
                    tvError.visibility = View.VISIBLE
                }
            }
        )
    }
}
