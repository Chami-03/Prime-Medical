import api from './index'

const resolveApiBaseUrl = () => {
    const configured = import.meta.env.VITE_API_URL || '/api/v1'
    if (configured.startsWith('http://') || configured.startsWith('https://')) {
        return configured
    }
    const normalized = configured.startsWith('/') ? configured : `/${configured}`
    return `${window.location.origin}${normalized}`
}

export const consultationApi = {
    start: (data) =>
        api.post('/consultations', data).then((r) => r.data),

    recordVitals: (id, data) =>
        api.post(`/consultations/${id}/vitals`, data).then((r) => r.data),

    updateNotes: (id, data) =>
        api.put(`/consultations/${id}/notes`, data).then((r) => r.data),

    updateBloodCheckup: (id, data) =>
        api.put(`/consultations/${id}/blood-checkup`, data).then((r) => r.data),

    end: (id) =>
        api.post(`/consultations/${id}/end`).then((r) => r.data),

    getById: (id) =>
        api.get(`/consultations/${id}`).then((r) => r.data),

    getPatientHistory: (patientId) =>
        api.get(`/consultations/patient/${patientId}`).then((r) => r.data),

    getPendingBloodCheckups: () =>
        api.get('/consultations/blood-checkup/pending').then((r) => r.data),

    getCompletedBloodCheckups: () =>
        api.get('/consultations/blood-checkup/completed').then((r) => r.data),

    streamVitalsUpdates: (consultationId, onVitalsUpdated, onError) => {
        const token = sessionStorage.getItem('accessToken')
        if (!token || !consultationId) {
            return () => {}
        }

        const url = `${resolveApiBaseUrl()}/consultations/${consultationId}/events`
        const controller = new AbortController()
        let stopped = false

        const connect = async () => {
            while (!stopped) {
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'text/event-stream',
                        },
                        cache: 'no-store',
                        signal: controller.signal,
                    })

                    if (!response.ok || !response.body) {
                        throw new Error(`Stream connection failed (${response.status})`)
                    }

                    const reader = response.body.getReader()
                    const decoder = new TextDecoder('utf-8')
                    let buffer = ''

                    while (!stopped) {
                        const { value, done } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        let separatorIndex = buffer.indexOf('\n\n')

                        while (separatorIndex !== -1) {
                            const rawEvent = buffer.slice(0, separatorIndex).replace(/\r/g, '')
                            buffer = buffer.slice(separatorIndex + 2)

                            let eventName = 'message'
                            for (const line of rawEvent.split('\n')) {
                                if (line.startsWith('event:')) {
                                    eventName = line.slice(6).trim()
                                }
                            }

                            if (eventName === 'vitals-updated') {
                                onVitalsUpdated?.()
                            }

                            separatorIndex = buffer.indexOf('\n\n')
                        }
                    }
                } catch (error) {
                    if (stopped || error?.name === 'AbortError') {
                        break
                    }
                    onError?.(error)
                }

                if (!stopped) {
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
            }
        }

        connect()

        return () => {
            stopped = true
            controller.abort()
        }
    },
}
