/* District HQ coordinates (approximate) used to place the template hospitals on the map. key 'ST|District' -> [lat, lng].
   Hospitals in hospitals.js carry their own lat/lng. Replace a template's position by giving it lat/lng in templates.js. */
const DIST_XY={
'JK|Srinagar':[34.08,74.80],'JK|Jammu':[32.73,74.87],'JK|Anantnag':[33.73,75.15],'LA|Leh':[34.16,77.58],'LA|Kargil':[34.56,76.13],'LA|Nubra':[34.55,77.56],
'PB|Amritsar':[31.63,74.87],'PB|Ludhiana':[30.90,75.86],'PB|Patiala':[30.34,76.39],'HP|Shimla':[31.10,77.17],'HP|Kangra':[32.22,76.32],'HP|Mandi':[31.71,76.93],
'UK|Dehradun':[30.32,78.03],'UK|Nainital':[29.38,79.46],'UK|Chamoli':[30.41,79.32],'CH|Chandigarh':[30.73,76.78],
'HR|Gurugram':[28.46,77.03],'HR|Hisar':[29.15,75.72],'HR|Karnal':[29.69,76.99],'DL|New Delhi':[28.61,77.21],'DL|North Delhi':[28.70,77.22],'DL|South Delhi':[28.52,77.22],
'UP|Lucknow':[26.85,80.95],'UP|Varanasi':[25.32,82.97],'UP|Gorakhpur':[26.76,83.37],'BR|Patna':[25.59,85.14],'BR|Gaya':[24.80,85.00],'BR|Muzaffarpur':[26.12,85.39],
'SK|Gangtok':[27.33,88.61],'SK|Namchi':[27.17,88.36],'SK|Mangan':[27.51,88.53],'AR|Itanagar':[27.08,93.61],'AR|Tawang':[27.59,91.86],'AR|Pasighat':[28.07,95.33],
'RJ|Jaipur':[26.91,75.79],'RJ|Jodhpur':[26.24,73.02],'RJ|Udaipur':[24.59,73.71],
'MP|Bhopal':[23.26,77.41],'MP|Indore':[22.72,75.86],'MP|Rewa':[24.53,81.30],'MP|Sagar':[23.84,78.74],'MP|Dindori':[22.94,81.08],'MP|Chhindwara':[22.06,78.94],
'JH|Ranchi':[23.34,85.31],'JH|Dhanbad':[23.80,86.43],'JH|Dumka':[24.27,87.25],'WB|Kolkata':[22.57,88.36],'WB|Siliguri':[26.72,88.43],'WB|Bankura':[23.23,87.07],
'AS|Guwahati':[26.14,91.74],'AS|Dibrugarh':[27.48,94.91],'AS|Silchar':[24.83,92.78],'NL|Kohima':[25.67,94.11],'NL|Dimapur':[25.91,93.73],'NL|Mokokchung':[26.32,94.52],
'GJ|Ahmedabad':[23.02,72.57],'GJ|Surat':[21.17,72.83],'GJ|Kutch':[23.25,69.67],'CG|Raipur':[21.25,81.63],'CG|Bastar':[19.08,82.02],'CG|Bilaspur':[22.08,82.14],
'OD|Bhubaneswar':[20.30,85.82],'OD|Koraput':[18.81,82.71],'OD|Cuttack':[20.46,85.88],'ML|Shillong':[25.58,91.89],'ML|Tura':[25.51,90.22],'ML|Jowai':[25.45,92.20],
'MN|Imphal':[24.82,93.94],'MN|Churachandpur':[24.33,93.68],'MN|Ukhrul':[25.12,94.36],'TR|Agartala':[23.83,91.28],'TR|Dhalai':[23.93,91.85],'TR|Unakoti':[24.33,92.00],
'MZ|Aizawl':[23.73,92.72],'MZ|Lunglei':[22.89,92.73],'MZ|Champhai':[23.47,93.33],'DN|Silvassa':[20.27,73.01],'DN|Daman':[20.40,72.83],'DN|Diu':[20.71,70.99],
'MH|Pune':[18.52,73.86],'MH|Nagpur':[21.15,79.09],'MH|Nashik':[20.00,73.79],'TS|Hyderabad':[17.39,78.49],'TS|Warangal':[17.97,79.59],'TS|Adilabad':[19.67,78.53],
'AP|Visakhapatnam':[17.69,83.22],'AP|Guntur':[16.31,80.44],'AP|Kurnool':[15.83,78.04],'GA|North Goa':[15.59,73.81],'GA|South Goa':[15.27,73.96],
'KA|Bengaluru':[12.97,77.59],'KA|Mysuru':[12.30,76.64],'KA|Belagavi':[15.85,74.50],'PY|Puducherry':[11.93,79.83],'PY|Karaikal':[10.92,79.84],'PY|Yanam':[16.73,82.22],
'LD|Kavaratti':[10.57,72.64],'LD|Agatti':[10.86,72.18],'KL|Thiruvananthapuram':[8.52,76.94],'KL|Kozhikode':[11.26,75.78],'KL|Idukki':[9.85,76.97],
'TN|Chennai':[13.08,80.27],'TN|Madurai':[9.93,78.12],'TN|Coimbatore':[11.02,76.96],'AN|Port Blair':[11.62,92.73],'AN|Nicobar':[9.17,92.76]
};
