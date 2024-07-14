document.addEventListener('DOMContentLoaded', function() {
    const sliderContainer = document.getElementById('sliderContainer');
    const dotContainer = document.getElementById('dotContainer');
    const images = sliderContainer.getElementsByClassName('slider-image');
    let currentIndex = 0;

    // Create dots
    for (let i = 0; i < images.length; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => showImage(i));
        dotContainer.appendChild(dot);
    }

    const dots = dotContainer.getElementsByClassName('dot');

    function showImage(index) {
        images[currentIndex].classList.remove('active');
        dots[currentIndex].classList.remove('active');
        currentIndex = (index + images.length) % images.length;
        images[currentIndex].classList.add('active');
        dots[currentIndex].classList.add('active');
    }

    function nextImage() {
        showImage(currentIndex + 1);
    }

    // Bắt đầu chuyển đổi ảnh tự động sau 5 giây
    setInterval(nextImage, 5000);

    // Hiệu ứng zoom đã được xử lý bằng CSS animation
});