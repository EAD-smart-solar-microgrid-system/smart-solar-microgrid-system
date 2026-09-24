package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.NearbyStationDto
import com.example.smartsolarmicrogridtradingsystem.data.repository.Member4DashboardRepository
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.StationCacheRepository
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

/**
 * Member 4 Google Maps screen for nearby microgrid stations.
 */
class NearbyStationsMapActivity : BaseActivity(), OnMapReadyCallback {

    private lateinit var sessionManager: SessionManager
    private lateinit var repository: Member4DashboardRepository
    private lateinit var stationCacheRepository: StationCacheRepository

    private lateinit var progressNearby: ProgressBar
    private lateinit var cardNearbyStatus: MaterialCardView
    private lateinit var tvNearbyStatus: TextView
    private lateinit var btnNearbyAction: MaterialButton
    private lateinit var cardStationDetails: MaterialCardView
    private lateinit var tvStationDetailName: TextView
    private lateinit var tvStationDetailDistance: TextView
    private lateinit var tvStationDetailStatus: TextView
    private lateinit var tvStationDetailCapacity: TextView
    private lateinit var tvStationDetailBattery: TextView
    private lateinit var tvStationDetailSchedule: TextView
    private lateinit var tvStationDetailCacheHint: TextView

    private var googleMap: GoogleMap? = null
    private val markerStationIds = mutableMapOf<Marker, String>()
    private var loadedStations: List<NearbyStationDto> = emptyList()
    private var lastKnownLatLng: LatLng? = null
    private var awaitingSettingsReturn = false

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val fineGranted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            onLocationPermissionGranted()
        } else {
            showPermissionDeniedState()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_nearby_stations_map)

        setupSystemBarPadding(findViewById(R.id.nearbyMapRoot))

        sessionManager = SessionManager(this)
        repository = Member4DashboardRepository()
        stationCacheRepository = StationCacheRepository(this)

        progressNearby = findViewById(R.id.progressNearby)
        cardNearbyStatus = findViewById(R.id.cardNearbyStatus)
        tvNearbyStatus = findViewById(R.id.tvNearbyStatus)
        btnNearbyAction = findViewById(R.id.btnNearbyAction)
        cardStationDetails = findViewById(R.id.cardStationDetails)
        tvStationDetailName = findViewById(R.id.tvStationDetailName)
        tvStationDetailDistance = findViewById(R.id.tvStationDetailDistance)
        tvStationDetailStatus = findViewById(R.id.tvStationDetailStatus)
        tvStationDetailCapacity = findViewById(R.id.tvStationDetailCapacity)
        tvStationDetailBattery = findViewById(R.id.tvStationDetailBattery)
        tvStationDetailSchedule = findViewById(R.id.tvStationDetailSchedule)
        tvStationDetailCacheHint = findViewById(R.id.tvStationDetailCacheHint)

        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.mapNearbyStations) as SupportMapFragment
        mapFragment.getMapAsync(this)

        checkLocationPermissionAndStart()
    }

    override fun onResume() {
        super.onResume()
        if (awaitingSettingsReturn && hasLocationPermission()) {
            awaitingSettingsReturn = false
            onLocationPermissionGranted()
        }
    }

    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        map.uiSettings.isZoomControlsEnabled = true
        map.setOnMarkerClickListener { marker ->
            val stationId = markerStationIds[marker] ?: return@setOnMarkerClickListener false
            val station = loadedStations.firstOrNull { it.id == stationId }
            if (station != null) {
                showStationDetails(station)
            }
            true
        }
        map.setOnMapClickListener {
            hideStationDetails()
        }

        if (hasLocationPermission()) {
            enableMyLocation(map)
            if (loadedStations.isEmpty() && lastKnownLatLng == null) {
                resolveCurrentLocationAndLoad()
            } else if (loadedStations.isNotEmpty()) {
                renderStations(loadedStations)
            }
        }
    }

    private fun checkLocationPermissionAndStart() {
        if (hasLocationPermission()) {
            onLocationPermissionGranted()
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    private fun onLocationPermissionGranted() {
        hideStatusCard()
        googleMap?.let { enableMyLocation(it) }
        resolveCurrentLocationAndLoad()
    }

    @SuppressLint("MissingPermission")
    private fun enableMyLocation(map: GoogleMap) {
        if (hasLocationPermission()) {
            map.isMyLocationEnabled = true
        }
    }

    @SuppressLint("MissingPermission")
    private fun resolveCurrentLocationAndLoad() {
        if (!hasLocationPermission()) {
            showPermissionDeniedState()
            return
        }

        showLoading(true)
        val client = LocationServices.getFusedLocationProviderClient(this)
        val cancellationTokenSource = CancellationTokenSource()

        client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cancellationTokenSource.token)
            .addOnSuccessListener { location ->
                if (location != null) {
                    lastKnownLatLng = LatLng(location.latitude, location.longitude)
                    loadNearbyStations(location.latitude, location.longitude)
                } else {
                    client.lastLocation
                        .addOnSuccessListener { last ->
                            if (last != null) {
                                lastKnownLatLng = LatLng(last.latitude, last.longitude)
                                loadNearbyStations(last.latitude, last.longitude)
                            } else {
                                showLoading(false)
                                showStatus(
                                    message = getString(R.string.nearby_location_unavailable),
                                    actionLabel = getString(R.string.action_retry),
                                    action = { resolveCurrentLocationAndLoad() }
                                )
                            }
                        }
                        .addOnFailureListener {
                            showLoading(false)
                            showStatus(
                                message = getString(R.string.nearby_location_unavailable),
                                actionLabel = getString(R.string.action_retry),
                                action = { resolveCurrentLocationAndLoad() }
                            )
                        }
                }
            }
            .addOnFailureListener {
                showLoading(false)
                showStatus(
                    message = getString(R.string.nearby_location_unavailable),
                    actionLabel = getString(R.string.action_retry),
                    action = { resolveCurrentLocationAndLoad() }
                )
            }
    }

    private fun loadNearbyStations(latitude: Double, longitude: Double) {
        showLoading(true)
        hideStationDetails()

        repository.getNearbyStations(
            latitude = latitude,
            longitude = longitude,
            radiusKm = DEFAULT_RADIUS_KM,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<List<NearbyStationDto>> {
                override fun onSuccess(result: NetworkResult.Success<List<NearbyStationDto>>) {
                    showLoading(false)
                    val stations = result.responseBody
                    stationCacheRepository.upsertNearbyStations(stations)
                    if (stations.isEmpty()) {
                        loadedStations = emptyList()
                        clearMarkers()
                        showNoResultsState()
                    } else {
                        hideStatusCard()
                        loadedStations = stations
                        renderStations(stations)
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    // Fall back to SQLite-cached stations near the user.
                    stationCacheRepository.getNearbyFromCache(
                        latitude = latitude,
                        longitude = longitude,
                        radiusKm = DEFAULT_RADIUS_KM
                    ) { cached ->
                        showLoading(false)
                        if (cached.isNotEmpty()) {
                            loadedStations = cached
                            renderStations(cached)
                            showStatus(
                                message = getString(R.string.nearby_network_error_cache_used),
                                actionLabel = getString(R.string.action_retry),
                                action = {
                                    lastKnownLatLng?.let {
                                        loadNearbyStations(it.latitude, it.longitude)
                                    } ?: resolveCurrentLocationAndLoad()
                                }
                            )
                        } else {
                            loadedStations = emptyList()
                            clearMarkers()
                            showStatus(
                                message = mapError(error),
                                actionLabel = getString(R.string.action_retry),
                                action = {
                                    lastKnownLatLng?.let {
                                        loadNearbyStations(it.latitude, it.longitude)
                                    } ?: resolveCurrentLocationAndLoad()
                                }
                            )
                        }
                    }
                }
            }
        )
    }

    private fun renderStations(stations: List<NearbyStationDto>) {
        val map = googleMap ?: return
        clearMarkers()

        val boundsBuilder = LatLngBounds.Builder()
        var hasPoints = false

        lastKnownLatLng?.let {
            boundsBuilder.include(it)
            hasPoints = true
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(it, DEFAULT_ZOOM))
        }

        stations.forEach { station ->
            val position = LatLng(station.latitude, station.longitude)
            val marker = map.addMarker(
                MarkerOptions()
                    .position(position)
                    .title(station.name)
                    .snippet(
                        getString(
                            R.string.nearby_marker_snippet,
                            String.format("%.2f", station.distanceKm),
                            station.status
                        )
                    )
            )
            if (marker != null) {
                markerStationIds[marker] = station.id
            }
            boundsBuilder.include(position)
            hasPoints = true
        }

        if (hasPoints && stations.isNotEmpty()) {
            try {
                val padding = resources.displayMetrics.density * 72f
                map.animateCamera(
                    CameraUpdateFactory.newLatLngBounds(boundsBuilder.build(), padding.toInt())
                )
            } catch (_: Exception) {
                stations.firstOrNull()?.let {
                    map.moveCamera(
                        CameraUpdateFactory.newLatLngZoom(
                            LatLng(it.latitude, it.longitude),
                            DEFAULT_ZOOM
                        )
                    )
                }
            }
        }
    }

    private fun clearMarkers() {
        markerStationIds.keys.forEach { it.remove() }
        markerStationIds.clear()
    }

    private fun showStationDetails(station: NearbyStationDto) {
        cardStationDetails.visibility = View.VISIBLE
        tvStationDetailName.text = station.name
        tvStationDetailDistance.text = getString(
            R.string.nearby_detail_distance,
            String.format("%.2f", station.distanceKm)
        )
        tvStationDetailStatus.text = getString(R.string.nearby_detail_status, station.status)
        tvStationDetailCapacity.text = getString(
            R.string.nearby_detail_capacity,
            String.format("%.2f", station.capacityKwPerHour)
        )
        tvStationDetailBattery.text = getString(
            R.string.nearby_detail_battery,
            station.batteryStorageSlotCapacity
        )

        val scheduleText = if (station.operatingSchedule.isEmpty()) {
            getString(R.string.nearby_detail_schedule_empty)
        } else {
            station.operatingSchedule.joinToString(separator = "\n") { entry ->
                "${entry.dayOfWeek}: ${entry.openTime} – ${entry.closeTime}"
            }
        }
        tvStationDetailSchedule.text = scheduleText
        tvStationDetailCacheHint.visibility =
            if (station.isFromCache) View.VISIBLE else View.GONE
    }

    private fun hideStationDetails() {
        cardStationDetails.visibility = View.GONE
    }

    private fun showNoResultsState() {
        showStatus(
            message = getString(R.string.nearby_no_results),
            actionLabel = getString(R.string.action_retry),
            action = {
                lastKnownLatLng?.let {
                    loadNearbyStations(it.latitude, it.longitude)
                } ?: resolveCurrentLocationAndLoad()
            }
        )
    }

    private fun showPermissionDeniedState() {
        showLoading(false)
        clearMarkers()
        hideStationDetails()
        showStatus(
            message = getString(R.string.nearby_permission_denied),
            actionLabel = getString(R.string.action_open_settings),
            action = {
                awaitingSettingsReturn = true
                val intent = Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.fromParts("package", packageName, null)
                )
                startActivity(intent)
            }
        )
    }

    private fun showLoading(isLoading: Boolean) {
        progressNearby.visibility = if (isLoading) View.VISIBLE else View.GONE
        if (isLoading) {
            hideStatusCard()
        }
    }

    private fun showStatus(message: String, actionLabel: String, action: () -> Unit) {
        tvNearbyStatus.text = message
        btnNearbyAction.text = actionLabel
        btnNearbyAction.setOnClickListener { action() }
        cardNearbyStatus.visibility = View.VISIBLE
    }

    private fun hideStatusCard() {
        cardNearbyStatus.visibility = View.GONE
    }

    private fun mapError(error: NetworkResult<Nothing>): String {
        return when (error) {
            is NetworkResult.Unauthorized -> getString(R.string.error_unauthorized)
            is NetworkResult.HttpError -> error.errorBody?.takeIf { it.isNotBlank() }
                ?: getString(R.string.error_api_generic, error.statusCode)
            is NetworkResult.NetworkError -> error.message
                ?: getString(R.string.error_network)
            else -> getString(R.string.error_unknown)
        }
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    companion object {
        const val DEFAULT_RADIUS_KM = 25.0
        private const val DEFAULT_ZOOM = 12f
    }
}
