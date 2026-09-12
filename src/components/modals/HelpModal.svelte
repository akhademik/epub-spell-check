<script lang="ts">
  import { appState } from "../../state.svelte"
</script>

{#if appState.activeModal === "help"}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-title"
  >
    <button
      type="button"
      class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0 p-0 m-0"
      onclick={() => appState.closeModal()}
      aria-label="Đóng hướng dẫn"
      tabindex="-1"
    ></button>

    <div
      class="relative z-10 w-full max-w-lg overflow-hidden border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl max-h-[90vh] flex flex-col"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 shrink-0"
      >
        <h3 id="help-title" class="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hướng dẫn sử dụng
        </h3>
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="Đóng"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-4 overflow-y-auto text-sm text-slate-300">
        <div>
          <h4 class="font-bold text-white mb-1">1. Tải lên tệp (EPUB, TXT, MD)</h4>
          <p class="text-slate-400">Kéo thả tệp <span class="text-blue-400 font-mono">.epub</span>, <span class="text-emerald-400 font-mono">.txt</span> hoặc <span class="text-purple-400 font-mono">.md</span> vào vùng tải tệp hoặc nhấp nút "File khác" trên thanh tiêu đề để bắt đầu soát lỗi ngay lập tức.</p>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">2. Phím tắt tiện ích</h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-400">
            <li><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">↑</kbd> / <kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">↓</kbd>: Di chuyển qua lại giữa các từ bị lỗi (tự động highlight và cuộn canh giữa danh sách).</li>
            <li><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">←</kbd> / <kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">→</kbd>: Di chuyển giữa các vị trí xuất hiện (instances) của cùng một từ lỗi trên khung xem trước.</li>
            <li><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">Delete</kbd> hoặc <kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">I</kbd>: Bỏ qua từ hiện tại (thêm vào danh sách Whitelist) và tự động chuyển sang từ kế tiếp.</li>
            <li><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">Esc</kbd>: Đóng modal/hướng dẫn đang mở.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">3. Hệ thống 4 tầng từ điển & Bộ lọc lỗi</h4>
          <p class="text-slate-400">
            Hệ thống tự động kích hoạt đồng thời 4 tầng từ điển: <strong>Tiếng Việt</strong>, <strong>Tên riêng & Địa danh</strong>, <strong>Ngoại ngữ & Từ mượn</strong>, và <strong>Viết tắt / Tuỳ chỉnh</strong>. Bạn có thể bật/tắt nhanh các nhóm lỗi (Từ lạ, Ngoại ngữ, Viết hoa, Chính tả, Ngữ cảnh) bằng các nút lọc phía trên danh sách từ lỗi.
          </p>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">4. Sửa lỗi chính tả & Thay thế từ</h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-400">
            <li>Nhấp vào nút từ gợi ý để thay thế đúng vị trí hiện tại.</li>
            <li>Nhấp nút <strong class="text-emerald-300 font-mono">all</strong> cạnh gợi ý để thay thế toàn bộ tất cả các vị trí xuất hiện của từ lỗi đó trong sách.</li>
            <li>Nhập từ tuỳ chỉnh vào ô "Nhập từ thay thế khác..." nếu muốn sửa thành từ chưa có trong gợi ý.</li>
            <li>Nhấp biểu tượng copy cạnh gợi ý để sao chép từ vào Clipboard.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">5. Xuất tệp đã sửa & Danh sách lỗi</h4>
          <p class="text-slate-400">
            Sau khi sửa, nhấp nút <strong>"Xuất [EPUB/TXT/MD]"</strong> trên thanh tiêu đề để tải về tệp hoàn chỉnh đã áp dụng sửa đổi. Bạn cũng có thể nhấp <strong>"Xuất lỗi"</strong> để tải về file text danh sách toàn bộ từ lỗi phát hiện được.
          </p>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">6. Quản trị từ điển (Admin)</h4>
          <p class="text-slate-400">
            Nhấp nút <strong>Admin</strong> trên thanh tiêu đề để tra cứu, thêm mới từ vựng, kiểm tra chất lượng từ điển hoặc kiểm tra trùng lặp giữa các tầng từ điển.
          </p>
        </div>
      </div>

      <div class="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end shrink-0">
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  </div>
{/if}
