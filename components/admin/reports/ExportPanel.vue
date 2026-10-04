<template>
  <div class="sp-export-panel">
    <div class="sp-export-card">
      <div class="sp-export-icon bg-green-100 text-green-700">
        <FileSpreadsheet class="w-6 h-6" stroke-width="1.5" />
      </div>
      <div class="sp-export-info">
        <h3>Exportar a Excel</h3>
        <p>Descarga el historial completo de pedidos o el inventario en formato .xlsx</p>
      </div>
      <div class="sp-export-actions">
        <button class="sp-action-btn" :disabled="loading" @click="exportExcel('orders')">
          <Loader2 v-if="loading && currentTask === 'excel_orders'" class="sp-spin w-4 h-4" />
          Pedidos
        </button>
        <button class="sp-action-btn" :disabled="loading" @click="exportExcel('products')">
          <Loader2 v-if="loading && currentTask === 'excel_products'" class="sp-spin w-4 h-4" />
          Inventario
        </button>
      </div>
    </div>

    <div class="sp-export-card">
      <div class="sp-export-icon bg-red-100 text-red-700">
        <FileText class="w-6 h-6" stroke-width="1.5" />
      </div>
      <div class="sp-export-info">
        <h3>Exportar a PDF</h3>
        <p>Genera un reporte en PDF listo para imprimir o enviar</p>
      </div>
      <div class="sp-export-actions">
        <button class="sp-action-btn" :disabled="loading" @click="exportPdf('orders')">
          <Loader2 v-if="loading && currentTask === 'pdf_orders'" class="sp-spin w-4 h-4" />
          Reporte Pedidos
        </button>
        <button class="sp-action-btn" :disabled="loading" @click="exportPdf('products')">
          <Loader2 v-if="loading && currentTask === 'pdf_products'" class="sp-spin w-4 h-4" />
          Reporte Inventario
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-vue-next';

// Nota: Importaciones dinámicas para no inflar el bundle inicial
// Se cargarán cuando se haga clic
const loading = ref(false);
const currentTask = ref('');

const formatPrice = useFormatPrice();
const { formatDateTime } = useFormatDateTime();

async function fetchExportData() {
  const { orders, products } = await $fetch('/api/admin/reports/export');
  return { orders, products };
}

const translateStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };
  return statusMap[status] || status;
};

async function exportExcel(type: 'orders' | 'products') {
  try {
    loading.value = true;
    currentTask.value = `excel_${type}`;
    
    // Importamos dinámicamente XLSX
    const { utils, writeFile } = await import('xlsx');
    const data = await fetchExportData();
    
    let ws;
    if (type === 'orders') {
      const formatted = data.orders.map((o: any) => ({
        'Código': o.orderCode,
        'Cliente': o.customerName,
        'Teléfono': o.customerPhone,
        'Total (S/)': o.total,
        'Estado': translateStatus(o.status),
        'Fecha': formatDateTime(o.createdAt),
        'Cant. Items': o.items?.length || 0
      }));
      ws = utils.json_to_sheet(formatted);
    } else {
      const formatted = data.products.map((p: any) => ({
        'ID': p.id,
        'Producto': p.name,
        'Categoría': p.category?.name || 'N/A',
        'Precio (S/)': p.price,
        'Stock': p.stock,
        'Estado': p.isActive ? 'Activo' : 'Inactivo',
        'Fecha Creación': formatDateTime(p.createdAt)
      }));
      ws = utils.json_to_sheet(formatted);
    }

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, type === 'orders' ? 'Pedidos' : 'Inventario');
    writeFile(wb, `Reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);

    useAppToast().add({ title: 'Excel exportado con éxito', color: 'success' });
  } catch (error) {
    console.error(error);
    useAppToast().add({ title: 'Error al exportar Excel', color: 'error' });
  } finally {
    loading.value = false;
    currentTask.value = '';
  }
}

async function exportPdf(type: 'orders' | 'products') {
  try {
    loading.value = true;
    currentTask.value = `pdf_${type}`;
    
    // Importamos dinámicamente jsPDF y autoTable
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const data = await fetchExportData();
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Reporte de ${type === 'orders' ? 'Pedidos' : 'Inventario'}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${formatDateTime(new Date().toISOString())}`, 14, 30);

    let head = [];
    let body = [];

    if (type === 'orders') {
      head = [['Código', 'Cliente', 'Estado', 'Total', 'Fecha']];
      body = data.orders.map((o: any) => [
        o.orderCode,
        o.customerName,
        translateStatus(o.status),
        `S/ ${o.total.toFixed(2)}`,
        formatDateTime(o.createdAt)
      ]);
    } else {
      head = [['ID', 'Producto', 'Categoría', 'Stock', 'Precio']];
      body = data.products.map((p: any) => [
        p.id,
        p.name,
        p.category?.name || 'N/A',
        p.stock.toString(),
        `S/ ${p.price.toFixed(2)}`
      ]);
    }

    autoTable(doc, {
      startY: 36,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [0, 174, 239] },
      styles: { fontSize: 9 }
    });

    doc.save(`Reporte_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    useAppToast().add({ title: 'PDF generado con éxito', color: 'success' });
  } catch (error) {
    console.error(error);
    useAppToast().add({ title: 'Error al generar PDF', color: 'error' });
  } finally {
    loading.value = false;
    currentTask.value = '';
  }
}
</script>

<style scoped>
.sp-export-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.sp-export-card {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-xl);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--sp-shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.sp-export-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sp-shadow-md);
}

.sp-export-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--sp-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sp-export-info h3 {
  margin: 0;
  font-size: var(--sp-text-lg);
  font-weight: 700;
  color: var(--sp-text-strong);
}

.sp-export-info p {
  margin: 0.25rem 0 0;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-soft);
  line-height: 1.5;
}

.sp-export-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--sp-border);
}

.sp-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--sp-surface-muted);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  padding: 0.5rem 1rem;
  font-size: var(--sp-text-xs);
  font-weight: 600;
  color: var(--sp-text-strong);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sp-action-btn:hover:not(:disabled) {
  background: var(--sp-surface-solid);
  border-color: var(--sp-border-strong);
}

.sp-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sp-spin {
  animation: sp-spin 1s linear infinite;
}
@keyframes sp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
