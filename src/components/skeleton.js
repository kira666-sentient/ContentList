export function createCardSkeleton() {
  const card = document.createElement('div');
  card.className = 'content-card skeleton-card';
  card.innerHTML = `
    <div class="card-media skeleton"></div>
    <div class="card-body">
      <div class="skeleton" style="height: 16px; width: 80%; margin-bottom: 8px;"></div>
      <div class="skeleton" style="height: 12px; width: 40%;"></div>
    </div>
  `;
  return card;
}

export function renderSkeletonGrid(container, count = 8) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.appendChild(createCardSkeleton());
  }
}
