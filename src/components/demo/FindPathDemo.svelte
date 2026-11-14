<script lang="ts">
/**
 * 寻路算法交互 demo —— 移植自旧博客 blog/2025/code/FindPath.vue
 * 去掉了 element-plus 依赖，改用原生控件；BFS 逐格动画保留。
 */
type Point = [number, number];

import { onMount } from "svelte";

const EMPTY = 0;
const WALL = 1;
const VISITED = 3;
const PATH = 4;

let len = $state(30);
let grids = $state<number[][]>([]);
let start = $state({ x: 0, y: 0 });
let target = $state({ x: 29, y: 29 });
let isTrying = $state(false);
let status = $state<{ text: string; tone: "ok" | "err" | "info" } | null>(null);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomGrid(n: number): number[][] {
	return Array.from({ length: n }, () =>
		Array.from({ length: n }, () => Math.floor(Math.random() * 2)),
	);
}

function reSet() {
	grids = randomGrid(len);
	status = null;
}

function onLenChange(next: number) {
	len = Math.max(2, Math.min(100, Math.floor(next) || 2));
	reSet();
	start = { x: 0, y: 0 };
	target = { x: len - 1, y: len - 1 };
}

/** 随机挖一条必定连通的路径，避免随机地图无解 */
function buildUnobstructedPath() {
	const path: Point[] = [[start.x, start.y]];
	let [x, y] = [start.x, start.y];
	while (x !== target.x || y !== target.y) {
		if (Math.random() > 0.5) {
			x += x < target.x ? 1 : x > target.x ? -1 : 0;
			if (x === path[path.length - 1][0]) y += y < target.y ? 1 : -1;
		} else {
			y += y < target.y ? 1 : y > target.y ? -1 : 0;
			if (y === path[path.length - 1][1]) x += x < target.x ? 1 : -1;
		}
		path.push([x, y]);
	}
	for (const [px, py] of path) grids[px][py] = EMPTY;
	grids = grids;
}

const isOverEdge = (grid: number[][], [x, y]: Point) =>
	x < 0 || x >= grid.length || y < 0 || y >= grid[0].length;

const isWall = (grid: number[][], [x, y]: Point) => grid[x][y] === WALL;

function getNextTickPoints(grid: number[][], [x, y]: Point): Point[] {
	return (
		[
			[x - 1, y],
			[x + 1, y],
			[x, y + 1],
			[x, y - 1],
		] as Point[]
	).filter((p) => !isOverEdge(grid, p) && !isWall(grid, p));
}

async function findPath(grid: number[][], from: Point, to: Point) {
	if (from[0] === to[0] && from[1] === to[1]) return [from];
	if (isOverEdge(grid, to) || isWall(grid, to)) {
		status = { text: `终点 ${to} 越界或落在障碍物上`, tone: "err" };
		return null;
	}
	if (isOverEdge(grid, from) || isWall(grid, from)) {
		status = { text: `起点 ${from} 越界或落在障碍物上`, tone: "err" };
		return null;
	}

	const visited = new Set<string>();
	const queue: Array<{ p: Point; path: Point[] }> = [{ p: from, path: [from] }];

	while (queue.length) {
		const { p, path } = queue.shift()!;
		const [x, y] = p;
		const key = `${x},${y}`;
		if (visited.has(key)) continue;
		visited.add(key);

		if (x === to[0] && y === to[1]) {
			for (const [px, py] of path) {
				await wait(20);
				grids[px][py] = PATH;
				grids = grids;
			}
			return path;
		}

		grids[x][y] = VISITED;
		grids = grids;
		await wait(20);

		for (const next of getNextTickPoints(grid, p)) {
			if (!visited.has(`${next[0]},${next[1]}`)) {
				queue.push({ p: next, path: [...path, next] });
			}
		}
	}
	return null;
}

async function getPath() {
	if (isTrying) return;
	isTrying = true;
	status = null;
	try {
		const result = await findPath(
			grids,
			[+start.x, +start.y],
			[+target.x, +target.y],
		);
		status = result
			? { text: `找到路径，共 ${result.length} 步`, tone: "ok" }
			: { text: "没有找到路径", tone: "err" };
	} finally {
		isTrying = false;
	}
}

function cellClass(cell: number) {
	if (cell === WALL) return "wall";
	if (cell === PATH) return "path";
	if (cell === VISITED) return "visited";
	return "open";
}

// 地图随机生成，放在客户端初始化避免 SSR/水合不一致
onMount(reSet);
</script>

<div class="demo">
	<div class="controls">
		<label>
			起点 x
			<input type="number" min="0" bind:value={start.x} />
		</label>
		<label>
			y
			<input type="number" min="0" bind:value={start.y} />
		</label>
		<label>
			终点 x
			<input type="number" min="0" bind:value={target.x} />
		</label>
		<label>
			y
			<input type="number" min="0" bind:value={target.y} />
		</label>
		<label>
			地图大小
			<input
				type="number"
				min="2"
				max="100"
				value={len}
				onchange={(e) => onLenChange(+e.currentTarget.value)}
			/>
		</label>
		<div class="actions">
			<button onclick={getPath} disabled={isTrying}>
				{isTrying ? "搜索中…" : "尝试"}
			</button>
			<button onclick={reSet} disabled={isTrying}>重置</button>
			<button onclick={buildUnobstructedPath} disabled={isTrying}>挖通</button>
		</div>
		{#if status}
			<p class="status {status.tone}">{status.text}</p>
		{/if}
	</div>

	<div
		class="gridwrap"
	>
		<div
			class="grid"
			style="grid-template-columns: repeat({len}, 1fr); grid-template-rows: repeat({len}, 1fr); aspect-ratio: 1;"
		>
			{#each grids as row, x (x)}
				{#each row as cell, y (y)}
					<div class="cell {cellClass(cell)}">
						{#if len <= 20}<span>{x},{y}</span>{/if}
					</div>
				{/each}
			{/each}
		</div>
	</div>
</div>

<style>
	.demo {
		--line: #d7dce3;
		--wall: #f0c05a;
		--visited: #a9c7f5;
		--path: #ff7a7a;
		--open: #f6f8fa;
		box-sizing: border-box;
		height: 100%;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font: 13px/1.5 system-ui, -apple-system, "PingFang SC", sans-serif;
		color: #1f2329;
		background: #fff;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
	}
	label {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
	}
	input {
		width: 64px;
		padding: 3px 6px;
		border: 1px solid var(--line);
		border-radius: 6px;
		font: inherit;
	}
	.actions {
		display: inline-flex;
		gap: 6px;
	}
	button {
		padding: 5px 14px;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: #fff;
		font: inherit;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		border-color: #9aa4b2;
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.status {
		margin: 0;
	}
	.status.ok {
		color: #1a7f37;
	}
	.status.err {
		color: #c62828;
	}
	.gridwrap {
		flex: 1;
		min-height: 0;
		display: flex;
		justify-content: center;
		container-type: size;
	}
	.grid {
		display: grid;
		/* 同时受容器宽高约束，保证正方形地图完整可见 */
		width: min(100%, 470px, 100cqh);
		align-self: center;
		border: 2px solid #c62828;
	}
	.cell {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: 1px solid rgb(0 0 0 / 6%);
		overflow: hidden;
		font-size: 0.55em;
		color: rgb(0 0 0 / 45%);
	}
	.cell.open {
		background: var(--open);
	}
	.cell.wall {
		background: var(--wall);
	}
	.cell.visited {
		background: var(--visited);
	}
	.cell.path {
		background: var(--path);
	}
</style>
