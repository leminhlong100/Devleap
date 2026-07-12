<script setup>
/**
 * Bảng dữ liệu dùng chung cho các trang admin: render <table> trên desktop,
 * tự chuyển sang danh sách thẻ (card-stack) dưới 720px để tránh scroll ngang.
 *
 * columns: [{ key, label, primary?, numeric?, mobileHidden? }]
 *   - primary: cột hiển thị làm tiêu đề thẻ trên mobile (không kèm label)
 *   - numeric: căn phải + class .num trên desktop
 *   - mobileHidden: ẩn cột này ở chế độ thẻ mobile (vd cột phụ ít quan trọng)
 * rows: mảng dữ liệu, mỗi phần tử là 1 hàng
 * rowKey: tên field làm key (mặc định 'id')
 *
 * Nội dung từng ô có thể tùy biến qua slot `#cell-<key>="{ row }"`, mặc định
 * hiển thị row[key].
 */
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  /** (row) => class value áp cho cả <tr> desktop và <article> thẻ mobile. */
  rowClass: { type: Function, default: null },
})
const classFor = (row) => (props.rowClass ? props.rowClass(row) : null)
</script>

<template>
  <div class="adt-wrap">
    <table class="adt-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ num: col.numeric }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row[rowKey]" :class="classFor(row)">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="{ num: col.numeric }"
          >
            <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="adt-cards">
      <article v-for="row in rows" :key="row[rowKey]" class="adt-card" :class="classFor(row)">
        <template v-for="col in columns" :key="col.key">
          <div v-if="col.primary" class="adt-card-title">
            <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
          </div>
          <div v-else-if="!col.mobileHidden" class="adt-card-row">
            <span class="adt-card-label">{{ col.label }}</span>
            <span class="adt-card-value" :class="{ num: col.numeric }">
              <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
            </span>
          </div>
        </template>
      </article>
    </div>
  </div>
</template>

<style scoped>
.adt-cards {
  display: none;
}

.adt-table {
  width: 100%;
  border-collapse: collapse;
}
.adt-table th,
.adt-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}
.adt-table th {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.adt-table .num {
  text-align: right;
}

@media (max-width: 720px) {
  .adt-table {
    display: none;
  }
  .adt-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .adt-card {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 14px 16px;
  }
  .adt-card-title {
    font-weight: 700;
    margin-bottom: 8px;
  }
  .adt-card-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 5px 0;
    font-size: 13.5px;
  }
  .adt-card-row + .adt-card-row {
    border-top: 1px dashed var(--line);
  }
  .adt-card-label {
    color: var(--muted-2);
    font-weight: 600;
    flex-shrink: 0;
  }
  .adt-card-value {
    text-align: right;
    min-width: 0;
  }
  .adt-card-value.num {
    font-variant-numeric: tabular-nums;
  }
}
</style>
