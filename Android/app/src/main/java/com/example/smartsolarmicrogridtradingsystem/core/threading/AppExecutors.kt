package com.example.smartsolarmicrogridtradingsystem.core.threading

import android.os.Handler
import android.os.Looper
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Central thread management utility providing reusable background thread pools
 * and main thread dispatching without allocating threads on demand.
 */
object AppExecutors {

    /**
     * Fixed-size thread pool for background networking and disk/database operations.
     */
    private val backgroundExecutor: ExecutorService = Executors.newFixedThreadPool(4)

    /**
     * Handler attached to the main UI looper.
     */
    private val mainThreadHandler: Handler = Handler(Looper.getMainLooper())

    /**
     * Executes a task asynchronously on a background worker thread.
     */
    fun executeInBackground(action: () -> Unit) {
        backgroundExecutor.execute { action() }
    }

    /**
     * Executes a Runnable asynchronously on a background worker thread.
     */
    fun executeInBackground(runnable: Runnable) {
        backgroundExecutor.execute(runnable)
    }

    /**
     * Dispatches a task to the Android main (UI) thread.
     * If already on the main thread, executes immediately.
     */
    fun executeOnMainThread(action: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            action()
        } else {
            mainThreadHandler.post { action() }
        }
    }

    /**
     * Dispatches a Runnable to the Android main (UI) thread.
     */
    fun executeOnMainThread(runnable: Runnable) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            runnable.run()
        } else {
            mainThreadHandler.post(runnable)
        }
    }

    /**
     * Exposes the background ExecutorService instance if required.
     */
    fun getBackgroundExecutor(): ExecutorService = backgroundExecutor
}
