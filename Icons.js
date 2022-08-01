import {SvgPlus} from "../SvgPlus/4.js";

export let Icons = {
  file: `<svg viewBox="0 0 96.56 115.261"><g><path class="i-icon" d="M23.305,5.169h49.951c9.314,0,16.865,7.551,16.865,16.865v71.194c0,9.314-7.551,16.865-16.865,16.865H23.305c-9.314,0-16.865-7.551-16.865-16.865V22.034C6.44,12.72,13.99,5.169,23.305,5.169z"/><g><line class="i-icon" x1="28.401" y1="28.427" x2="68.343" y2="28.427"/><line class="i-icon" x1="28.401" y1="51.647" x2="58.093" y2="51.647"/></g></g></svg>`,
  folder: `<svg viewBox="0 0 120 120">
  	<path class = "i-icon" d="M6.9,51.8V28.8c0-8.8,7.1-15.9,15.9-15.9H66c8.8,0,15.9,7.1,15.9,15.9v3.4"/>
  	<path class = "i-icon" d="M113.1,51.8v35.6c0,10.9-8.8,19.7-19.7,19.7H26.6c-10.9,0-19.7-8.8-19.7-19.7V51.8c0-10.9,8.8-19.7,19.7-19.7h66.9
  		C104.3,32.1,113.1,40.9,113.1,51.8z"/>
  </svg>`,
  tick: `<svg viewBox="0 0 96.329 114.458"><polyline class="i-icon" points="91.075,5.324 10.101,108.17 5.25,50.607 "/></svg>`,
  cross: `<svg viewBox="0 0 96.329 114.458"><line class="i-icon" x1="91.075" y1="11.826" x2="5.611" y2="104.26"/><line class="i-icon" x1="4.948" y1="11.691" x2="91.11" y2="105.144"/></svg>`
}

export class Icon extends SvgPlus {
  constructor(name) {
    super(SvgPlus.parseSVGString(Icons[name]));
    this.class = "icon";
  }
}
