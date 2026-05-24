import { useUserStore } from '../store/userStore.jsx'
export function useAuth() { return useUserStore() }
