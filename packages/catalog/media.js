function uniqueUrls(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value.trim()))];
}

export const productMedia = {
  "silk-pillowcase": {
    imageUrl: "https://m.media-amazon.com/images/I/61aMeMjNdnL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/61ckk8ORzvL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61NKzvw9bTL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71V1uckHUmL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71r1aBZg80L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71D4uurXTUL._AC_SL1500_.jpg",
    ],
  },
  "temperature-mug": {
    imageUrl: "https://m.media-amazon.com/images/I/51pcI-tu5+L._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/81+OSDQLWGL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71SA6H3OIsL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81rQjPOh0oL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71DmkfTsT0L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71jnYnrpAdL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71K1Q+3ck7L._AC_SL1500_.jpg",
    ],
  },
  "digital-frame": {
    imageUrl: "https://m.media-amazon.com/images/I/71U0lh9XF9L._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/51sIKNIcjBL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71ddimZBcgL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61koMzoPk+L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61toU6PodrL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71umUvpXuBL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71V03aYKC2L._AC_SL1500_.jpg",
    ],
  },
  "mini-photo-printer": {
    imageUrl: "https://m.media-amazon.com/images/I/81sCLWe7g7L._AC_SL1500_.jpg",
  },
  "sunrise-alarm": {
    imageUrl: "https://m.media-amazon.com/images/I/91rrv5C9kkL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/819o21WSPiL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81JzAzh9YwL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81WdPsZmmsL._AC_SL1500_.jpg",
    ],
  },
  "luxury-throw": {
    imageUrl: "https://m.media-amazon.com/images/I/818BrMLxniL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/91DXvz-zMRL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/91q7JZUhqmL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81TE3GoMqwL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81uuXG0SX9L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81J+tQ2L9qL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81ha56NYOYL._AC_SL1500_.jpg",
    ],
  },
  "walking-pad": {
    imageUrl: "https://m.media-amazon.com/images/I/7112Rcj4-1L._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71YjbKgfXOL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71sf98qVz0L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71iWJSu3DKL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71e4lnDm-YL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71F2McfQF5L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71WxuNQi7OL._AC_SL1500_.jpg",
    ],
  },
  earbuds: {
    imageUrl: "https://m.media-amazon.com/images/I/5130BCxweAL._AC_SL1200_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/614cRPUcGyL._AC_SL1200_.jpg",
      "https://m.media-amazon.com/images/I/61aX8Anaj4L._AC_SL1200_.jpg",
      "https://m.media-amazon.com/images/I/61DcZ08IK9L._AC_SL1200_.jpg",
      "https://m.media-amazon.com/images/I/61ILvtu4RLL._AC_SL1201_.jpg",
      "https://m.media-amazon.com/images/I/61kWYqBOm4L._AC_SL1200_.jpg",
      "https://m.media-amazon.com/images/I/61lx+1+VHTL._AC_SL1500_.jpg",
    ],
  },
  projector: {
    imageUrl: "https://m.media-amazon.com/images/I/71edbbOhUHL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/716qkM+pW6L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71xHTPP81wL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/811Y4QTjvrL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71MSZsZi0fL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81KpROU0ROL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71TX7fGthqL._AC_SL1500_.jpg",
    ],
  },
  "magsafe-stand": {
    imageUrl: "https://m.media-amazon.com/images/I/610ezpL6j8L.__AC_SX300_SY300_QL70_ML2_.jpg",
  },
  "jewelry-case": {
    imageUrl: "https://m.media-amazon.com/images/I/81+AOP7-G-L._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71W-x57HEYL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81t8VHxs2jL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71rtjr7HNWL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71CJfthmxoL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81T+DmZNx0L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71srcygm43L._AC_SL1500_.jpg",
    ],
  },
  "candle-warmer": {
    imageUrl: "https://m.media-amazon.com/images/I/71zstznPjvL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71UdtoFBFuL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81rmGdz5PJL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71TyXMOpEuL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81TX5wZl6uL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71bZykqL7dL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81syQvlCc7L._AC_SL1500_.jpg",
    ],
  },
  "vanity-mirror": {
    imageUrl: "https://m.media-amazon.com/images/I/71t3G6KN3BL._AC_SX679_.jpg",
  },
  "cashmere-robe": {
    imageUrl: "https://m.media-amazon.com/images/I/71RG-S+XvbL._AC_SX679_.jpg",
  },
  "kindle-paperwhite": {
    imageUrl: "https://m.media-amazon.com/images/I/81I4120duxL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71biqZck9GL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81YnlrX3m6L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81ku5UfokQL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71bvBZbolPL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71DZRJ5Z0-L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81ZMyYYj2lL._AC_SL1500_.jpg",
    ],
  },
  "ninja-creami": {
    imageUrl: "https://m.media-amazon.com/images/I/71t9VcZQVVL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/81zRiBWWaLL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81cRYMl0bDL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/711g97HkVNL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81-6rcrGakL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71BaSAfN6ML._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71eFbBlKSpL._AC_SL1500_.jpg",
    ],
  },
  "nespresso-machine": {
    imageUrl: "https://m.media-amazon.com/images/I/51lzRJrfsAL._AC_SL1000_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/61A18LxcZYL._AC_SL1000_.jpg",
      "https://m.media-amazon.com/images/I/51oXm-MnubL._AC_SL1000_.jpg",
      "https://m.media-amazon.com/images/I/6149PuK5iFL._AC_SL1000_.jpg",
      "https://m.media-amazon.com/images/I/51oYvfEUPWL._AC_SL1000_.jpg",
      "https://m.media-amazon.com/images/I/61u5aTVjyIL._AC_SL1000_.jpg",
      "https://m.media-amazon.com/images/I/61DDUvzWfBL._AC_SL1000_.jpg",
    ],
  },
  "owala-bottle": {
    imageUrl: "https://m.media-amazon.com/images/I/61ezSdimm-L._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71eMnxtsWOL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71106e+UGcL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71H-mHA88VL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71+dm76qdQL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71juNj4G2eL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81z-eXxY0LL._AC_SL1500_.jpg",
    ],
  },
  "theragun-relief": {
    imageUrl: "https://m.media-amazon.com/images/I/61f9mqZJ4rL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/81JCxpTWmHL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81KHD4x3VzL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71PHoomQnCL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81PfJIFZV4L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/815R4dUQvGL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71e9ePUTz+L._AC_SL1500_.jpg",
    ],
  },
  "ugg-slippers": {
    imageUrl: "https://m.media-amazon.com/images/I/71wlb5ErSzL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71oa4LJCQlL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71QwFVVZ2AL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71TUVzMQP+L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/712CfJe82GL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/814IvAQWhdL._AC_SL1500_.jpg",
    ],
  },
  "stanley-quencher": {
    imageUrl: "https://m.media-amazon.com/images/I/51WQDu4lPEL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/61KrHjObSoL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/51KNfNjPo1L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61YrNkigMNL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61LrfO9oTuL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71ITDYpJHnL._AC_SL1500_.jpg",
    ],
  },
  "laneige-set": {
    imageUrl: "https://m.media-amazon.com/images/I/71X3-073tkL._SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/71yAlMOtXwL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71DGi2kuO4L._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/814ZVB6RSeL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71XDRaHqf5L._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81PKEzIuSEL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71CGIzOm-EL._SL1500_.jpg",
    ],
  },
  "bose-speaker": {
    imageUrl: "https://m.media-amazon.com/images/I/71uv8YRxwuL._AC_SL1500_.jpg",
    galleryImages: [
      "https://m.media-amazon.com/images/I/81rCZDB6x7L._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81Wz5OPoweL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/51n-X2RhURL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81fee7FXUaL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81N46WDvmdL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/91rE1NSIt+L._AC_SL1500_.jpg",
    ],
  },
  "sol-de-janeiro": {
    imageUrl: "https://static.thcdn.com/productimg/original/12545102-1214895116732476.jpg",
    galleryImages: ["https://static.thcdn.com/productimg/original/12545102-1864895116865487.jpg"],
  },
};

export function getProductMedia(id) {
  return productMedia[id] || {};
}

export function applyProductMedia(gift = {}) {
  const media = getProductMedia(gift.id);
  const imageUrl = media.imageUrl || gift.imageUrl || gift.image || "";
  const galleryImages = uniqueUrls([...(gift.galleryImages || []), ...(media.galleryImages || [])]).filter(
    (value) => value !== imageUrl
  );

  return {
    ...gift,
    ...media,
    imageUrl,
    galleryImages,
  };
}
