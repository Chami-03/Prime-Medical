import api from './index'

export const assistantApi = {
  chat: (message, history = []) =>
    api.post('/assistant/chat', { message, history }).then((r) => r.data),
}
