import React from "react";
import "./styles/SMSForm.css";

const allTimeZones = [
  {
    offset: "GMT-12:00",
    name: "Etc/GMT-12"
  },
  {
    offset: "GMT-11:00",
    name: "Etc/GMT-11"
  },
  {
    offset: "GMT-11:00",
    name: "Pacific/Midway"
  },
  {
    offset: "GMT-10:00",
    name: "America/Adak"
  },
  {
    offset: "GMT-09:00",
    name: "America/Anchorage"
  },
  {
    offset: "GMT-09:00",
    name: "Pacific/Gambier"
  },
  {
    offset: "GMT-08:00",
    name: "America/Dawson_Creek"
  },
  {
    offset: "GMT-08:00",
    name: "America/Ensenada"
  },
  {
    offset: "GMT-08:00",
    name: "America/Los_Angeles"
  },
  {
    offset: "GMT-07:00",
    name: "America/Chihuahua"
  },
  {
    offset: "GMT-07:00",
    name: "America/Denver"
  },
  {
    offset: "GMT-06:00",
    name: "America/Belize"
  },
  {
    offset: "GMT-06:00",
    name: "America/Cancun"
  },
  {
    offset: "GMT-06:00",
    name: "America/Chicago"
  },
  {
    offset: "GMT-06:00",
    name: "Chile/EasterIsland"
  },
  {
    offset: "GMT-05:00",
    name: "America/Bogota"
  },
  {
    offset: "GMT-05:00",
    name: "America/Havana"
  },
  {
    offset: "GMT-05:00",
    name: "America/New_York"
  },
  {
    offset: "GMT-04:30",
    name: "America/Caracas"
  },
  {
    offset: "GMT-04:00",
    name: "America/Campo_Grande"
  },
  {
    offset: "GMT-04:00",
    name: "America/Glace_Bay"
  },
  {
    offset: "GMT-04:00",
    name: "America/Goose_Bay"
  },
  {
    offset: "GMT-04:00",
    name: "America/Santiago"
  },
  {
    offset: "GMT-04:00",
    name: "America/La_Paz"
  },
  {
    offset: "GMT-03:00",
    name: "America/Argentina/Buenos_Aires"
  },
  {
    offset: "GMT-03:00",
    name: "America/Montevideo"
  },
  {
    offset: "GMT-03:00",
    name: "America/Araguaina"
  },
  {
    offset: "GMT-03:00",
    name: "America/Godthab"
  },
  {
    offset: "GMT-03:00",
    name: "America/Miquelon"
  },
  {
    offset: "GMT-03:00",
    name: "America/Sao_Paulo"
  },
  {
    offset: "GMT-03:30",
    name: "America/St_Johns"
  },
  {
    offset: "GMT-02:00",
    name: "America/Noronha"
  },
  {
    offset: "GMT-01:00",
    name: "Atlantic/Cape_Verde"
  },
  {
    offset: "GMT",
    name: "Europe/Belfast"
  },
  {
    offset: "GMT",
    name: "Africa/Abidjan"
  },
  {
    offset: "GMT",
    name: "Europe/Dublin"
  },
  {
    offset: "GMT",
    name: "Europe/Lisbon"
  },
  {
    offset: "GMT",
    name: "Europe/London"
  },
  {
    offset: "UTC",
    name: "UTC"
  },
  {
    offset: "GMT+01:00",
    name: "Africa/Algiers"
  },
  {
    offset: "GMT+01:00",
    name: "Africa/Windhoek"
  },
  {
    offset: "GMT+01:00",
    name: "Atlantic/Azores"
  },
  {
    offset: "GMT+01:00",
    name: "Atlantic/Stanley"
  },
  {
    offset: "GMT+01:00",
    name: "Europe/Amsterdam"
  },
  {
    offset: "GMT+01:00",
    name: "Europe/Belgrade"
  },
  {
    offset: "GMT+01:00",
    name: "Europe/Brussels"
  },
  {
    offset: "GMT+02:00",
    name: "Africa/Cairo"
  },
  {
    offset: "GMT+02:00",
    name: "Africa/Blantyre"
  },
  {
    offset: "GMT+02:00",
    name: "Asia/Beirut"
  },
  {
    offset: "GMT+02:00",
    name: "Asia/Damascus"
  },
  {
    offset: "GMT+02:00",
    name: "Asia/Gaza"
  },
  {
    offset: "GMT+02:00",
    name: "Asia/Jerusalem"
  },
  {
    offset: "GMT+03:00",
    name: "Africa/Addis_Ababa"
  },
  {
    offset: "GMT+03:00",
    name: "Asia/Riyadh89"
  },
  {
    offset: "GMT+03:00",
    name: "Europe/Minsk"
  },
  {
    offset: "GMT+03:30",
    name: "Asia/Tehran"
  },
  {
    offset: "GMT+04:00",
    name: "Asia/Dubai"
  },
  {
    offset: "GMT+04:00",
    name: "Asia/Yerevan"
  },
  {
    offset: "GMT+04:00",
    name: "Europe/Moscow"
  },
  {
    offset: "GMT+04:30",
    name: "Asia/Kabul"
  },
  {
    offset: "GMT+05:00",
    name: "Asia/Tashkent"
  },
  {
    offset: "GMT+05:30",
    name: "Asia/Kolkata"
  },
  {
    offset: "GMT+05:45",
    name: "Asia/Katmandu"
  },
  {
    offset: "GMT+06:00",
    name: "Asia/Dhaka"
  },
  {
    offset: "GMT+06:00",
    name: "Asia/Yekaterinburg"
  },
  {
    offset: "GMT+06:30",
    name: "Asia/Rangoon"
  },
  {
    offset: "GMT+07:00",
    name: "Asia/Bangkok"
  },
  {
    offset: "GMT+07:00",
    name: "Asia/Novosibirsk"
  },
  {
    offset: "GMT+08:00",
    name: "Etc/GMT+8"
  },
  {
    offset: "GMT+08:00",
    name: "Asia/Hong_Kong"
  },
  {
    offset: "GMT+08:00",
    name: "Asia/Krasnoyarsk"
  },
  {
    offset: "GMT+08:00",
    name: "Australia/Perth"
  },
  {
    offset: "GMT+08:45",
    name: "Australia/Eucla"
  },
  {
    offset: "GMT+09:00",
    name: "Asia/Irkutsk"
  },
  {
    offset: "GMT+09:00",
    name: "Asia/Seoul"
  },
  {
    offset: "GMT+09:00",
    name: "Asia/Tokyo"
  },
  {
    offset: "GMT+09:30",
    name: "Australia/Adelaide"
  },
  {
    offset: "GMT+09:30",
    name: "Australia/Darwin"
  },
  {
    offset: "GMT+09:30",
    name: "Pacific/Marquesas"
  },
  {
    offset: "GMT+10:00",
    name: "Etc/GMT+10"
  },
  {
    offset: "GMT+10:00",
    name: "Australia/Brisbane"
  },
  {
    offset: "GMT+10:00",
    name: "Australia/Hobart"
  },
  {
    offset: "GMT+10:00",
    name: "Asia/Yakutsk"
  },
  {
    offset: "GMT+10:30",
    name: "Australia/Lord_Howe"
  },
  {
    offset: "GMT+11:00",
    name: "Asia/Vladivostok"
  },
  {
    offset: "GMT+11:30",
    name: "Pacific/Norfolk"
  },
  {
    offset: "GMT+12:00",
    name: "Etc/GMT+12"
  },
  {
    offset: "GMT+12:00",
    name: "Asia/Anadyr"
  },
  {
    offset: "GMT+12:00",
    name: "Asia/Magadan"
  },
  {
    offset: "GMT+12:00",
    name: "Pacific/Auckland"
  },
  {
    offset: "GMT+12:45",
    name: "Pacific/Chatham"
  },
  {
    offset: "GMT+13:00",
    name: "Pacific/Tongatapu"
  },
  {
    offset: "GMT+14:00",
    name: "Pacific/Kiritimati"
  }
];

const countryList = [
  "India",
  "Afghanistan",
  "Albania",
  "Algeria",
  "American Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas (the)",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia (Plurinational State of)",
  "Bonaire, Sint Eustatius and Saba",
  "Bosnia and Herzegovina",
  "Botswana",
  "Bouvet Island",
  "Brazil",
  "British Indian Ocean Territory (the)",
  "Brunei Darussalam",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cayman Islands (the)",
  "Central African Republic (the)",
  "Chad",
  "Chile",
  "China",
  "Christmas Island",
  "Cocos (Keeling) Islands (the)",
  "Colombia",
  "Comoros (the)",
  "Congo (the Democratic Republic of the)",
  "Congo (the)",
  "Cook Islands (the)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Curaçao",
  "Cyprus",
  "Czechia",
  "Côte d'Ivoire",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic (the)",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Falkland Islands (the) [Malvinas]",
  "Faroe Islands (the)",
  "Fiji",
  "Finland",
  "France",
  "French Guiana",
  "French Polynesia",
  "French Southern Territories (the)",
  "Gabon",
  "Gambia (the)",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Heard Island and McDonald Islands",
  "Holy See (the)",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Iran (Islamic Republic of)",
  "Iraq",
  "Ireland",
  "Isle of Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea (the Democratic People's Republic of)",
  "Korea (the Republic of)",
  "Kuwait",
  "Kyrgyzstan",
  "Lao People's Democratic Republic (the)",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macao",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands (the)",
  "Martinique",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Micronesia (Federated States of)",
  "Moldova (the Republic of)",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands (the)",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger (the)",
  "Nigeria",
  "Niue",
  "Norfolk Island",
  "Northern Mariana Islands (the)",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine, State of",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines (the)",
  "Pitcairn",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Republic of North Macedonia",
  "Romania",
  "Russian Federation (the)",
  "Rwanda",
  "Réunion",
  "Saint Barthélemy",
  "Saint Helena, Ascension and Tristan da Cunha",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Martin (French part)",
  "Saint Pierre and Miquelon",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Sint Maarten (Dutch part)",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Georgia and the South Sandwich Islands",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan (the)",
  "Suriname",
  "Svalbard and Jan Mayen",
  "Sweden",
  "Switzerland",
  "Syrian Arab Republic",
  "Taiwan (Province of China)",
  "Tajikistan",
  "Tanzania, United Republic of",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tokelau",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Turks and Caicos Islands (the)",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates (the)",
  "United Kingdom of Great Britain and Northern Ireland (the)",
  "United States Minor Outlying Islands (the)",
  "United States of America (the)",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela (Bolivarian Republic of)",
  "Viet Nam",
  "Virgin Islands (British)",
  "Virgin Islands (U.S.)",
  "Wallis and Futuna",
  "Western Sahara",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Åland Islands"
];

class SMSForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: {
        phoneNumber: "",
        name: "",
        location: "",
        timeZone: ""
      },
      submitted: false,
      error: false
    };

    this.onHandleChange = this.onHandleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onHandleChange(event) {
    const name = event.target.getAttribute("name");
    this.setState({
      message: {
        ...this.state.message,
        [name]: event.target.value
      }
    });
  }

  onSubmit(event) {
    event.preventDefault();
    this.setState({ submitting: true });
    console.log(this.state.message);
    fetch("http://localhost:8082/api/users/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.state.message)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.setState({
            error: false,
            submitting: false,
            message: {
              phoneNumber: "",
              name: "",
              location: "",
              timeZone: ""
            }
          });
        } else {
          this.setState({
            error: true,
            submitting: false
          });
        }
      });
  }

  render() {
    return (
      <div className="formElements">
        <form
          onSubmit={this.onSubmit}
          className={this.state.error ? "error sms-form" : "sms-form"}
        >
          <label htmlFor="name">Name: </label>
          <input
            type="name"
            name="name"
            id="name"
            onChange={this.onHandleChange}
            value={this.state.message.name}
            required
          />
          <label htmlFor="phoneNumber">Number: </label>
          <p>please remember to append your country code e.g. +1</p>
          <input
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            onChange={this.onHandleChange}
            value={this.state.message.phoneNumber}
            required
          ></input>
          <label htmlFor="location">Country: </label>
          <select
            id="location"
            name="location"
            onChange={this.onHandleChange}
            required
          >
            <option value="" selected disabled hidden>
              Select your Country
            </option>
            {countryList.map(country => {
              return <option value={country}>{country}</option>;
            })}
          </select>
          <label htmlFor="timeZone">Timezone: </label>
          <select
            id="timeZone"
            name="timeZone"
            onChange={this.onHandleChange}
            required
          >
            <option value="" selected disabled hidden>
              Select your Timezone
            </option>
            {allTimeZones.map(timezone => {
              return (
                <option value={timezone.name}>
                  {timezone.offset} - {timezone.name}
                </option>
              );
            })}
          </select>
          <div style={{ textAlign: "center" }}>
            <button type="submit" className="submit-btn">
              subscribe
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default SMSForm;
