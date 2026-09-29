export const useDashboard = () => {
  const isNotificationsSlideoverOpen = useState<boolean>('dashboard-notifications-open', () => false)

  function openNotifications() {
    isNotificationsSlideoverOpen.value = true
  }

  function closeNotifications() {
    isNotificationsSlideoverOpen.value = false
  }

  function toggleNotifications() {
    isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
  }

  return {
    isNotificationsSlideoverOpen,
    openNotifications,
    closeNotifications,
    toggleNotifications
  }
}
