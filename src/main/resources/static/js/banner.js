// V1.0
// const banner = document.querySelector("div.banner");

// let count = 0;
// setInterval(() => {
//     count++;
//     count === 6 && (count = 0);
//     banner.style.transform = `translate(-${1500 * count}px)`;
//     banner.style.transition = `transform 0.5s`;
// }, 1000);

// V2.0
// const banner = document.querySelector("div.banner");
// const firstBanner = document.createElement("div");
// let count = 0;

// firstBanner.innerHTML = `<img src="images/001.png">`;
// banner.appendChild(firstBanner);

// setInterval(() => {
//     count++;
//     banner.style.transform = `translate(-${1500 * count}px)`;
//     banner.style.transition = `transform 0.5s`;

//     if (count === 6) {
//         setTimeout(() => {
//             banner.style.transform = `translate(0px)`;
//             banner.style.transition = `transform 0s`;
//         }, 500);
//         count = 0;
//     }
// }, 1000);

// V2.1
// const banner = document.querySelector("div.banner");
// const firstBanner = document.createElement("div");
// const lastBanner = document.createElement("div");
// const arrows = document.querySelectorAll("div.arrow");
// let count = 1;

// firstBanner.innerHTML = `<img src="images/001.png">`;
// lastBanner.innerHTML = `<img src="images/006.png">`;
// banner.appendChild(firstBanner);
// banner.prepend(lastBanner);

// banner.style.transform = `translate(-1500px)`;

// const autoSlide = () => {
//     count++;
//     banner.style.transform = `translate(-${1500 * count}px)`;
//     banner.style.transition = `transform 0.5s`;

//     if (count === 7) {
//         setTimeout(() => {
//             banner.style.transform = `translate(-1500px)`;
//             banner.style.transition = `transform 0s`;
//         }, 500);
//         count = 1;
//     }
// };

// let autoSlideInterval = setInterval(autoSlide, 1000);
// let arrowCheck = false;

// arrows.forEach((arrow) => {
//     const img = arrow.firstElementChild;
//     img.addEventListener("click", (e) => {
//         if (arrowCheck) {
//             return;
//         }
//         arrowCheck = true;
//         clearInterval(autoSlideInterval);

//         const arrowType = arrow.classList[1];
//         if (arrowType === "left") {
//             count--;
//             banner.style.transform = `translate(-${1500 * count}px)`;
//             banner.style.transition = `transform 0.5s`;

//             if (count === 0) {
//                 setTimeout(() => {
//                     banner.style.transform = `translate(-9000px)`;
//                     banner.style.transition = `transform 0s`;
//                 }, 500);
//                 count = 6;
//             }
//         } else {
//             count++;
//             banner.style.transform = `translate(-${1500 * count}px)`;
//             banner.style.transition = `transform 0.5s`;

//             if (count === 7) {
//                 setTimeout(() => {
//                     banner.style.transform = `translate(-1500px)`;
//                     banner.style.transition = `transform 0s`;
//                 }, 500);
//                 count = 1;
//             }
//         }
//         autoSlideInterval = setInterval(autoSlide, 1000);
//         setTimeout(() => {
//             arrowCheck = false;
//         }, 500);
//     });
// });

// V2.2
const banner = document.querySelector("div.banner");
const firstBanner = document.createElement("div");
const lastBanner = document.createElement("div");
const arrows = document.querySelectorAll("div.arrow");
const buttons = document.querySelectorAll("div.button-container button");
let count = 1;
let tempButton = buttons[0];

firstBanner.innerHTML = `<img src="/images/001.png">`;
lastBanner.innerHTML = `<img src="/images/006.png">`;
banner.appendChild(firstBanner);
banner.prepend(lastBanner);

buttons[0].style.background = "#2ef388";

banner.style.transform = `translate(-1500px)`;

const autoSlide = () => {
    count++;
    banner.style.transform = `translate(-${1500 * count}px)`;
    banner.style.transition = `transform 0.5s`;

    if (count === 7) {
        setTimeout(() => {
            banner.style.transform = `translate(-1500px)`;
            banner.style.transition = `transform 0s`;
        }, 500);
        count = 1;
    }

    tempButton.style.background = "white";
    tempButton = buttons[count - 1];
    buttons[count - 1].style.background = "#2ef388";
};

let autoSlideInterval = setInterval(autoSlide, 1530);
let arrowCheck = false;

arrows.forEach((arrow) => {
    const img = arrow.firstElementChild;
    img.addEventListener("click", (e) => {
        if (arrowCheck) {
            return;
        }
        arrowCheck = true;
        clearInterval(autoSlideInterval);

        const arrowType = arrow.classList[1];
        if (arrowType === "left") {
            count--;
            banner.style.transform = `translate(-${1500 * count}px)`;
            banner.style.transition = `transform 0.5s`;

            if (count === 0) {
                setTimeout(() => {
                    banner.style.transform = `translate(-9000px)`;
                    banner.style.transition = `transform 0s`;
                }, 500);
                count = 6;
            }
        } else {
            count++;
            banner.style.transform = `translate(-${1500 * count}px)`;
            banner.style.transition = `transform 0.5s`;

            if (count === 7) {
                setTimeout(() => {
                    banner.style.transform = `translate(-1500px)`;
                    banner.style.transition = `transform 0s`;
                }, 500);
                count = 1;
            }
        }

        tempButton.style.background = "white";
        tempButton = buttons[count - 1];
        buttons[count - 1].style.background = "#2ef388";

        autoSlideInterval = setInterval(autoSlide, 1000);
        setTimeout(() => {
            arrowCheck = false;
        }, 500);
    });
});

let buttonCheck = false;

buttons.forEach((button, i) => {
    button.addEventListener("click", (e) => {
        if (buttonCheck) {
            return;
        }
        buttonCheck = true;
        clearInterval(autoSlideInterval);

        count = i + 1;
        banner.style.transform = `translate(-${1500 * count}px)`;
        banner.style.transition = `transform 0.5s`;

        tempButton.style.background = "white";
        tempButton = buttons[count - 1];
        buttons[count - 1].style.background = "#2ef388";

        autoSlideInterval = setInterval(autoSlide, 1000);
        setTimeout(() => {
            buttonCheck = false;
        }, 500);
    });
});
