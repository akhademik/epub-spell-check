<script lang="ts">
  import { appState } from "../state.svelte"

  let isDragging = $state(false)
  let fileInputElement: HTMLInputElement | undefined = $state()

  function handleFileSelected(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      appState.handleFile(file)
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging = false
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      appState.handleFile(file)
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging = true
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragging = false
  }
</script>

<div class="w-full max-w-3xl mx-auto my-auto py-12 px-4 animate-fadeIn">
  <input
    bind:this={fileInputElement}
    type="file"
    accept=".epub"
    class="hidden"
    onchange={handleFileSelected}
  />

  <button
    type="button"
    onclick={() => fileInputElement?.click()}
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    class="w-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 {isDragging
      ? 'border-blue-500 bg-blue-950/30 scale-[1.01]'
      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'} shadow-2xl"
  >
    <div class="p-5 mb-6 text-blue-400 bg-blue-950/60 rounded-2xl border border-blue-800/50 shadow-inner">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-12 h-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    </div>

    <h2 class="text-2xl font-bold text-slate-100 mb-2">
      Kéo & thả tệp <span class="text-blue-400">.epub</span> vào đây
    </h2>
   


  </button>
</div>
