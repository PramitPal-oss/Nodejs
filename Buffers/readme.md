<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

## What is Buffer ?

In Node.js, Buffers are essential for handling binary data. Here's a breakdown of what they are and why we use them:

**Definition of Buffers :** Buffers are used to represent a fixed-length sequence of bytes. They are essentially memory spaces allocated to store binary data.

**Purpose of Buffers:**

**1. Data Handling:** Buffers allow for the efficient transfer of data between different sources. For example, when a client uploads a file to a Node.js server, the data being transferred through the network is handled by Buffers.

**2. Processing Data:** Buffers can temporarily hold data while it is being processed, like converting video files or extracting audio. They facilitate communication between different applications, such as passing data from a Node.js application to a C++ application.

Common Use Cases:

**2.1. File System Operations:** When reading or writing files, the data is typically represented as Buffers since files are binary.

**2.2. Networking:** Buffers are critical when interacting with network sockets for sending and receiving data.

**2.3. Streams:** Buffers sit at the core of streams in Node.js, supporting the flow of data through various processing stages.

**2.4. Memory Management:** Buffers provide a dedicated memory location for handling binary data without interference from other processes, which is crucial for reliable performance.

In summary, Buffers are a fundamental component in Node.js for efficiently managing binary data transfer and processing across various applications and modules. Understanding how to use Buffers is vital for effective Node.js development.

### Concept of Binary Number (Base 2 Number)

**8 Bits = 1 Bytes**

Let's Create a 8 Bit Number

_Let's Compute this number_

**Binary to Decimal Conversion : (Base 2 Number)**

<span style="color: brown;font-weight: 600;">7 6 5 4 3 2 1 0</span> **(Indexes)**
<span style="color: blue;font-weight: 600;">0 0 0 0 1 1 1 1</span> **(Binary Number)**

1 \* 2<sup>0</sup> = 1
1 \* 2<sup>1</sup> = 2
1 \* 2<sup>2</sup> = 4
1 \* 2<sup>3</sup> = 8
0 \* 2<sup>4</sup> = 0
0 \* 2<sup>5</sup> = 0
0 \* 2<sup>6</sup> = 0
0 \* 2<sup>7</sup> = 0

**Total** = 1 + 2+ 4 + 8 = 15

0 0 0 0 1 1 1 <span style="font-weight: 600;"><ins>1</ins> This one is Least Significant Digit (LSD) And for Binary it is called Least Significant Bit (LSB)</span>

<span style="font-weight: 600;">This zero is Most Significant Digit (MSD) And for Binary it is called Most Significant Bit (MSB) <ins>0</ins> </span> 0 0 0 1 1 1

**Decimal Number : (Base 10 Number)**

<span style="color: brown;font-weight: 600;">2 1 0</span> **(Indexes)**
<span style="color: blue;font-weight: 600;">3 1 9</span> **(Decimal Number)**

9 \* 10<sup>0</sup> = 9
1 \* 10<sup>1</sup> = 10
3 \* 10<sup>2</sup> = 300

**Total** = 9 + 10 + 300 = 319

<span style="font-weight: 600;">Just Like binary number decimal number are also same type. They are in range of 0 to 9. </span>

### Why we need Hexadecimal Number ?

Hexadecimal numbers are important for several reasons, especially in computing:

**Base 16 System:** Hexadecimal is a base 16 numeric system, which means it uses 16 symbols (0-9 and A-F) to represent values. This compact representation helps in reducing the length of binary numbers.

**Simplicity in Conversion:** Converting between hexadecimal and binary is straightforward. Each hexadecimal digit corresponds to exactly four binary bits. This makes it much easier to read and manage large binary numbers, as fewer characters are needed in hexadecimal.

**Memory Addressing:** In computing, hexadecimal is often used for memory addresses and IP addresses. It's simpler to express these in hexadecimal than in binary or decimal, which makes debugging and programming more efficient.

**Efficiency:** When dealing with files, buffer sizes, or color codes in graphics (like RGB values), hexadecimal notation provides a neat and concise way to represent data. For example, a color code like #FF5733 is easier to interpret at a glance than its binary equivalent.

Overall, hexadecimal numbers provide a more manageable representation of binary data, which is essential in software engineering.

1. <ins>**How HexaDecimal Number look like ?**</ins>

   <span style="font-weight: 600;">0x456 So this is a hexadecimal number with idicator 0x.</span>

2. <ins>**HexaDecimal to Decimal Conversion:**</ins>

   <span style="color: brown;font-weight: 600;">2 1 0</span> **(Indexes)**
   <span style="color: blue;font-weight: 600;">4 5 6</span> **(HexaDecimal Number)**

   6 \* 16<sup>0</sup> = 6
   5 \* 16<sup>1</sup> = 80
   4 \* 16<sup>2</sup> = 1024

   **Total** = 6 + 80 + 1024 = 1110

3. <ins>**Representation of All HexaDecimal Number:**</ins>

   <span style="color: blue;font-weight: 600;">0 1 2 3 4 5 6 7 8 9 A B C D E F</span> **(HexaDecimal Number)**
   <span style="font-weight: 600;">A = 10 B = 11 C = 12 D = 13 E = 14 F = 15</span>

4. <ins>**Conversion of complex number:**</ins>

   <span style="color: brown;font-weight: 600;">3 2 1 0</span> **(Indexes)**
   <span style="color: blue;font-weight: 600;">f a 3 c</span> **(HexaDecimal Number)**

   12 \* 16<sup>0</sup> = 12
   3 \* 16<sup>1</sup> = 48
   10 \* 16<sup>2</sup> = 2560
   15 \* 16<sup>3</sup> = 61440

   **Total** = 12 + 48 + 2560 + 61440 = 64060

5. <ins>**Characters Comparision between All numbers:**</ins>

   **Decimal (Base 10) Number :** 16777215 (8 Characters)

   **Hexadecimal (Base 16) Number :** 0xFFFFFF (6 Characters)

   **Binary (Base 2) Number :** 1111 1111 1111 1111 1111 1111 (24 Characters)

<img src="./public/Table hexa.png" alt="table image">

6. <ins>**Some usecase of Hexadecimal Number:**</ins>

- **#:** Colors codes in image editing application and HTML #FFFF , #000000
- **%:** Expressing some character in URLs like space (%20)
- **&#x | &#160:** Expressing unicode character in HTML, XHTML and XML. Uncode means
  **&nbsp** this one we use in html to create space but in number system it is actually **&#160**. Learn more about unicode [HTML Entities Tutorial - W3Schools](https://www.w3schools.com/html/html_entities.asp)

<img src="./public/Use of Hexa Decimal Number.png" alt="table image">

### What is character encoading ?

Character encoding is a system that maps characters to numbers, allowing computers to process text. Here's a breakdown of the concept:

**Purpose:** Since computers only understand numbers (binary), character encoding allows for the representation of human-readable characters (like letters and symbols) as numerical values.

**Character Sets:** A character set is a collection of characters with assigned numbers. For instance, in ASCII, each letter is represented by a unique number (e.g., 'A' is 65) which is then translated into binary.

**Encoding Process:** Character encoding assigns a sequence of bytes (bits) to each character. For example, in UTF-8 encoding, the character 'A' (represented as 01000001 in binary) and the number 65 can look the same in binary, but the interpretation depends on the context in which the data is being used.

**Common Encodings:** UTF-8 is a widely used character encoding that supports a vast range of characters, adhering to the Unicode standard. It can represent characters using a variable number of bytes, allowing compatibility with various languages and symbols.

**Context Sensitivity:** The computer interprets the binary data as a character or a number based on the context in which it is being used. For example, if the binary 01000001 is processed as ASCII, it represents 'A', but if it is processed as an integer, it signifies the number 65.

Understanding character encoding is essential for working with text in programming, as it ensures that characters are displayed and processed correctly by computers.

1. <ins>**Two Popular types of character sets**</ins>

   - **Unicode :** A standard for representing and encoading characters in most of the writing systems world wide. It defines 1,49,813 characters (version 15.1). for example character get assigned number 115

   - **ASCII :** it defines 128 characters, lowercase and uppercase of letters a-z, numbers from 0-9, punctuations [$, (, !, @...] and some control characters like DEL (Delete)

Basically ASCII are only made for english and where Unicode has all language support. So the value for s in ASCII is same in Unicode. There is no different in this.

**Dec** = Decimal Value  
**Char** = Character

**Explanation**

- `'5'` has the int value **53**
- If we write `'5' - '0'`, it evaluates to `53 - 48`, or the int value **5**
- If we write `char c = 'B' + 32;`, then `c` stores `'b'`
- `s` has decimal value of **115** and hex value of **73**. So as we know the index (3 \* 16<sup>0</sup> = 3) + (7 \* 16<sup>1</sup> = 112) = 115

- Character Encodaing is everywhere. When You write somthing in terminal or in textbox each and every thing is encoded otherwise computer can't understand.

- All ASCII characters are 1bytes that means 8 bits.

- [Decimal ASCII list ](https://www.cs.cmu.edu/~pattis/15-1XX/common/handouts/ascii.html)
- [It also has hexadecimal sets. ](https://www.freecodecamp.org/news/ascii-table-hex-to-ascii-value-character-code-chart-2/)

2. **<ins>What is encoder and decoder ? what is the use of them ?</ins>**

   **Encoder** helps to convert the human readable data (image, video , file etc) to the computer readable Binary system (0 and 1). So An image encoder will take an image and covert in 0 and 1 to store this in computer hard drive or some where.

   **Decoder** is exactly oppsite. A decoader will take those 0 and 1 and convert this something meaningfull to human.

3. **<ins>What Character encoading?</ins>**

   _A system of assigns a sequence of bytes (Just some zeros and one) to a character._ It is build in operating system. Without this we can't even write anything in terminal. So character encoding always running behind the scene whenever we write something in operating system.

**Most common Character encoading is UTF-8 character encoading**

- It is defined by the unicode standard therefore its character has the same number as the unicode.

- **Description:** UTF-8 is a variable-length character encoding. It uses 1 to 4 bytes per character.
  **Encoding Rules:**
  1 byte for ASCII characters (U+0000 to U+007F).
  2 bytes for characters in the range U+0080 to U+07FF.
  3 bytes for characters in the range U+0800 to U+FFFF.
  4 bytes for characters in the range U+10000 to U+10FFFF.
  **Benefits:**
  Backward compatible with ASCII.
  Efficient for text predominantly in English or other ASCII-compatible languages.
  **Use Case:** Commonly used on the web and in files like HTML, JSON, and XML.

**UTF-16 is another character encoading**

- **Description:** UTF-16 is also a variable-length encoding, but it uses either 2 or 4 bytes per character.
  **Encoding Rules:**
  2 bytes for characters in the Basic Multilingual Plane (BMP) (U+0000 to U+FFFF).
  4 bytes for supplementary characters (U+10000 to U+10FFFF).
  **Benefits:**
  Efficient for representing many non-Latin scripts and emojis.
  **Drawbacks:**
  Not ASCII-compatible.
  Less space-efficient for ASCII text compared to UTF-8.
  **Use Case:** Used in environments like Windows and Java

<span style="color: blue;font-weight: 600;">s t r i n g</span> **(Character)**

**utf-8 (MINIMUM RANGE 1 BYTES = 8 BITS)**

s = 115 = 0111 0011
t = 116 = 0111 0100
r = 114 = 0111 0010
i = 105 = 0110 1001
n = 110 = 0110 1110
g = 103 = 0110 0111

**utf-16 (MINIMUM RANGE 2 BYTES = 16 BITS)**

s = 0073 = 0000 0000 0111 0011
t = 0074 = 0000 0000 0111 0100
r = 0072 = 0000 0000 0111 0010
i = 0069 = 0000 0000 0110 1001
n = 006E = 0000 0000 0010 1110
G = 0067 = 0000 0000 0110 0111

**Convert a Decimal number to binary number:**

34434445 ÷ 16 = 2152152 remainder 13 → D
2152152 ÷ 16 = 134509 remainder 8 → 8
134509 ÷ 16 = 8406 remainder 13 → D
8406 ÷ 16 = 525 remainder 6 → 6
525 ÷ 16 = 32 remainder 13 → D
32 ÷ 16 = 2 remainder 0 → 0
2 ÷ 16 = 0 remainder 2 → 2

**(34434445)<sub>10</sub> = (20D6D8D)<sub>16</sub>**

### Buffers in Node.js :

1. Remember in nodejs each amount of buffer holds exactly **8 bits or 1 bytes** and **YOU CAN't CHANGE THIS!**

2. Bufers actually works like array.

3. Buffer size is fixed means once you allocate a specific size of buffer you can't change that. Suppose you allocate 32bits of buffer and then you assign 36bits then the last 4 bits will automatically cut down by nodejs.

4. Maximum value in 8bit can be 255. And You can't go negative because lowest number is 0.
   because for 8 bit max will be **1111 1111 (Binary) = 255 (Decimal)**
   lowest number can **0000 0000 (Binary Number) = 0 (Decimal)**
