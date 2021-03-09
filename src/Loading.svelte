<script>
  import { fade } from 'svelte/transition';
</script>

<main transition:fade={{ duration: 300 }}>
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#b9b9b9" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4 32C4 47.464 16.536 60 32 60C33.1046 60 34 60.8954 34 62C34 63.1046 33.1046 64 32 64C14.3269 64 0 49.6731 0 32C0 14.3269 14.3269 0 32 0C33.1046 0 34 0.895431 34 2C34 3.10457 33.1046 4 32 4C16.536 4 4 16.536 4 32Z"
      fill="#d8d8d8"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 32 32"
        to="360 32 32"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
</main>

<style>
  main {
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }
</style>
