<script lang="ts">
  import { onMount } from "svelte"
  import Header from "./components/Header.svelte"
  import ClearWhitelistModal from "./components/modals/ClearWhitelistModal.svelte"
  import HelpModal from "./components/modals/HelpModal.svelte"
  import SettingsModal from "./components/modals/SettingsModal.svelte"
  import ProcessingUI from "./components/ProcessingUI.svelte"
  import ResultsView from "./components/ResultsView.svelte"
  import ToastContainer from "./components/ToastContainer.svelte"
  import UploadSection from "./components/UploadSection.svelte"
  import { appState } from "./state.svelte"

  onMount(() => {
    appState.init()
  })

  function handleKeydown(event: KeyboardEvent) {
    // Ignore keys when user is typing in input or textarea
    const activeEl = document.activeElement
    if (
      activeEl &&
      (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
    ) {
      return
    }

    if (appState.activeModal) {
      if (event.key === "Escape") {
        appState.closeModal()
      }
      return
    }

    if (appState.currentFilteredErrors.length === 0) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        appState.navigateGroup("down")
        break
      case "ArrowUp":
        event.preventDefault()
        appState.navigateGroup("up")
        break
      case "Delete":
      case "i":
      case "I":
        if (appState.currentGroup) {
          event.preventDefault()
          appState.quickIgnore()
        }
        break
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen flex flex-col bg-slate-950 text-slate-200">
  <Header />

  <main class="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-6">
    {#if appState.isProcessing}
      <ProcessingUI />
    {:else if appState.loadedTextContent.length > 0}
      <ResultsView />
    {:else}
      <UploadSection />
    {/if}
  </main>

  <footer class="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
    Soát Lỗi Chính Tả EPUB Tiếng Việt
  </footer>

  <!-- Modals -->
  <SettingsModal />
  <HelpModal />
  <ClearWhitelistModal />

  <!-- Toast Notification Container -->
  <ToastContainer />
</div>
