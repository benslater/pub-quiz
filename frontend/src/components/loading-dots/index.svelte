<script>

</script>

<style>
  .dots {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }
  .dots div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #41403e;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }
  .dots div:nth-child(1) {
    left: 8px;
    animation: dots1 0.6s infinite;
  }
  .dots div:nth-child(2) {
    left: 8px;
    animation: dots2 0.6s infinite;
  }
  .dots div:nth-child(3) {
    left: 32px;
    animation: dots2 0.6s infinite;
  }
  .dots div:nth-child(4) {
    left: 56px;
    animation: dots3 0.6s infinite;
  }
  @keyframes dots1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes dots3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes dots2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
</style>

<div class="dots">
  <div />
  <div />
  <div />
  <div />
</div>
