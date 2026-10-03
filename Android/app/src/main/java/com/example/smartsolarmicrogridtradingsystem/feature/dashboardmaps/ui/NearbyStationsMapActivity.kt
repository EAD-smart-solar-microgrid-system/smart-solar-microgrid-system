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
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import androidx.core.graphics.drawable.DrawableCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

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
    private var lastQueryCenter: LatLng? = null
    private var suppressCameraIdleReload = false
    private var awaitingSettingsReturn = false
    private var isNearbyRequestInFlight = false

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
        map.setOnCameraIdleListener {
            if (suppressCameraIdleReload || isNearbyRequestInFlight) {
                return@setOnCameraIdleListener
            }
            val center = map.cameraPosition.target
            if (shouldReloadForMapCenter(center)) {
                loadNearbyStations(center.latitude, center.longitude, fitCameraToResults = false)
            }
        }

        if (hasLocationPermission()) {
            enableMyLocation(map)
            if (loadedStations.isEmpty() && lastKnownLatLng == null) {
                resolveCurrentLocationAndLoad()
            } else if (loadedStations.isNotEmpty()) {
                renderStations(loadedStations, fitCameraToResults = true)
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
                    loadNearbyStations(
                        location.latitude,
                        location.longitude,
                        fitCameraToResults = true
                    )
                } else {
                    client.lastLocation
                        .addOnSuccessListener { last ->
                            if (last != null) {
                                lastKnownLatLng = LatLng(last.latitude, last.longitude)
                                loadNearbyStations(
                                    last.latitude,
                                    last.longitude,
                                    fitCameraToResults = true
                                )
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

    private fun loadNearbyStations(
        latitude: Double,
        longitude: Double,
        fitCameraToResults: Boolean
    ) {
        if (isNearbyRequestInFlight) {
            return
        }

        isNearbyRequestInFlight = true
        lastQueryCenter = LatLng(latitude, longitude)
        showLoading(true)
        hideStationDetails()

        repository.getNearbyStations(
            latitude = latitude,
            longitude = longitude,
            radiusKm = DEFAULT_RADIUS_KM,
            bearerToken = sessionManager.getToken(),
            callback = object : ApiCallback<List<NearbyStationDto>> {
                override fun onSuccess(result: NetworkResult.Success<List<NearbyStationDto>>) {
                    isNearbyRequestInFlight = false
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
                        renderStations(stations, fitCameraToResults)
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    // Fall back to SQLite-cached stations near the user.
                    stationCacheRepository.getNearbyFromCache(
                        latitude = latitude,
                        longitude = longitude,
                        radiusKm = DEFAULT_RADIUS_KM
                    ) { cached ->
                        isNearbyRequestInFlight = false
                        showLoading(false)
                        if (cached.isNotEmpty()) {
                            loadedStations = cached
                            renderStations(cached, fitCameraToResults)
                            showStatus(
                                message = getString(R.string.nearby_network_error_cache_used),
                                actionLabel = getString(R.string.action_retry),
                                action = {
                                    lastKnownLatLng?.let {
                                        loadNearbyStations(
                                            it.latitude,
                                            it.longitude,
                                            fitCameraToResults = true
                                        )
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
                                        loadNearbyStations(
                                            it.latitude,
                                            it.longitude,
                                            fitCameraToResults = true
                                        )
                                    } ?: resolveCurrentLocationAndLoad()
                                }
                            )
                        }
                    }
                }
            }
        )
    }

    private fun shouldReloadForMapCenter(center: LatLng): Boolean {
        val last = lastQueryCenter ?: return true
        return distanceKm(last, center) >= RELOAD_DISTANCE_KM
    }

    private fun distanceKm(from: LatLng, to: LatLng): Double {
        val earthRadiusKm = 6371.0
        val dLat = Math.toRadians(to.latitude - from.latitude)
        val dLon = Math.toRadians(to.longitude - from.longitude)
        val lat1 = Math.toRadians(from.latitude)
        val lat2 = Math.toRadians(to.latitude)
        val a = sin(dLat / 2).pow(2.0) + cos(lat1) * cos(lat2) * sin(dLon / 2).pow(2.0)
        return 2.0 * earthRadiusKm * asin(sqrt(a))
    }

    private fun renderStations(stations: List<NearbyStationDto>, fitCameraToResults: Boolean) {
        val map = googleMap ?: return
        clearMarkers()

        val boundsBuilder = LatLngBounds.Builder()
        var hasPoints = false

        lastKnownLatLng?.let {
            boundsBuilder.include(it)
            hasPoints = true
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
                    .icon(getSolarHubMarkerIcon(station.status))
                    .anchor(0.5f, 0.96f)
            )
            if (marker != null) {
                markerStationIds[marker] = station.id
            }
            boundsBuilder.include(position)
            hasPoints = true
        }

        if (!fitCameraToResults || !hasPoints || stations.isEmpty()) {
            return
        }

        suppressCameraIdleReload = true
        try {
            val padding = resources.displayMetrics.density * 72f
            map.animateCamera(
                CameraUpdateFactory.newLatLngBounds(boundsBuilder.build(), padding.toInt()),
                object : GoogleMap.CancelableCallback {
                    override fun onFinish() {
                        suppressCameraIdleReload = false
                    }

                    override fun onCancel() {
                        suppressCameraIdleReload = false
                    }
                }
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
            suppressCameraIdleReload = false
        }
    }

    private fun clearMarkers() {
        markerStationIds.keys.forEach { it.remove() }
        markerStationIds.clear()
    }

    private var activeSolarHubIcon: BitmapDescriptor? = null
    private var inactiveSolarHubIcon: BitmapDescriptor? = null

    /**
     * Resolves the cached ⚡ solar hub marker icon based on station status.
     */
    private fun getSolarHubMarkerIcon(status: String?): BitmapDescriptor {
        val isActive = !status.equals("Inactive", ignoreCase = true)
        return if (isActive) {
            activeSolarHubIcon ?: createSolarHubMarkerBitmap(isActive = true).also { activeSolarHubIcon = it }
        } else {
            inactiveSolarHubIcon ?: createSolarHubMarkerBitmap(isActive = false).also { inactiveSolarHubIcon = it }
        }
    }

    /**
     * Generates a teardrop map pin featuring the solar lightning bolt (⚡) icon.
     */
    private fun createSolarHubMarkerBitmap(isActive: Boolean): BitmapDescriptor {
        val density = resources.displayMetrics.density
        val widthDp = 38f
        val heightDp = 48f
        val widthPx = (widthDp * density).toInt()
        val heightPx = (heightDp * density).toInt()
        val radius = 15f * density
        val centerX = widthPx / 2f
        val centerY = radius + (2.5f * density)
        val tipY = heightPx - (2f * density)

        val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Teardrop map pin path
        val pinPath = Path().apply {
            arcTo(
                centerX - radius,
                centerY - radius,
                centerX + radius,
                centerY + radius,
                140f,
                260f,
                false
            )
            lineTo(centerX, tipY)
            close()
        }

        // Fill background (Solar Orange for active, Slate for inactive)
        val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = if (isActive) Color.parseColor("#FF7A1A") else Color.parseColor("#64748B")
            style = Paint.Style.FILL
        }
        canvas.drawPath(pinPath, fillPaint)

        // Crisp white border
        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.STROKE
            strokeWidth = 2.5f * density
            strokeJoin = Paint.Join.ROUND
        }
        canvas.drawPath(pinPath, strokePaint)

        // Draw centered solar lightning bolt (⚡)
        val boltDrawable = ContextCompat.getDrawable(this, R.drawable.ic_solar_bolt)
        if (boltDrawable != null) {
            val iconSize = (18f * density).toInt()
            val left = (centerX - iconSize / 2f).toInt()
            val top = (centerY - iconSize / 2f).toInt()
            boltDrawable.setBounds(left, top, left + iconSize, top + iconSize)
            DrawableCompat.setTint(boltDrawable.mutate(), Color.WHITE)
            boltDrawable.draw(canvas)
        }

        return BitmapDescriptorFactory.fromBitmap(bitmap)
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
                    loadNearbyStations(
                        it.latitude,
                        it.longitude,
                        fitCameraToResults = true
                    )
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
        /** Wide enough to show multiple Sri Lanka stations around the map center. */
        const val DEFAULT_RADIUS_KM = 200.0
        private const val RELOAD_DISTANCE_KM = 25.0
        private const val DEFAULT_ZOOM = 12f
    }
}
