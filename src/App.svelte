<script>
  import { fly } from 'svelte/transition';

  import Loading from './Loading.svelte';
  import Core from './core.js';

  import scene from './scenes/data_center';
  // import scene from './scenes/cube';

  const core = new Core();

  function wait(milliseconds) {
    return new Promise((res) => {
      setTimeout(res, milliseconds);
    });
  }

  let pop;
  let display = false;
  let loading = true;
  let name;
  core.onMouseMove((e, selected) => {
    const mesh = selected.selected();
    if (mesh) {
      display = true;
      name = mesh.meta['name'];
      pop.style.top = e.clientY + 'px';
      pop.style.left = e.clientX + 'px';
    } else {
      display = false;
    }
  });

  Promise.all([scene(core), wait(500)]).then(() => {
    core.run();
    loading = false;
  });
</script>

<div>
  <main bind:this={pop}>
    {#if display}
      <div transition:fly={{ y: 20, duration: 200 }}>
        <h3>{name}</h3>
        <div class="guide-line" />
      </div>
    {/if}
  </main>
  {#if loading}
    <Loading />
  {/if}
</div>

<style>
  main {
    position: absolute;
    transform: translate(-50%, -120%);
    top: 0;
    left: 0;
    font-family: 'Stick', 'PingFang SC', 'tahoma', 'Microsoft Yahei', 'helvetica', 'sans-serif';
  }
  main > div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  main > div > h3 {
    margin: 4px 0;
    color: #459afe;
    padding: 8px 12px;
    border-radius: 2px;
    font-weight: normal;
    font-size: 1rem;
    background-color: #d1dff6;
  }
  div.guide-line {
    width: 2px;
    height: 64px;
    background-color: #d1dff6;
  }
</style>
