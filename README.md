# Combobulate

A deployable, lightweight neural net implementation for all JS runtimes.

# TODO:

- Dropout
- SNN Compliant activations
- TCN testing
- Boolean function scale-up testing
- Serialization and hydration testing
- Predictor mode
- Finish up the `README` info

# Getting Started With Neural Nets

This is a brief introduction to the anatomy of a neural net.

Neural nets are objects which approximate a target function `f` via a process called 'gradient decent.' Lot's of people like to explain neural nets with greek letters, linear algebra, and lots and lots of Einstein sums. I think this is stupid, and hope this little intro serves as a practical intro to neural nets for ~~dummies~~ engineers like myself. As a contrived example, we'll consider the `xor` function:

```javascript
xor(false, false) // false
xor(false, true) // true
xor(true, false) // true
xor(true, true) // false
```

The `xor` function takes two booleans and returns a boolean. Simple enough. There is absolutely no reason to ever use a neural net to approximate `xor`, but we're going to do it anyway. Besides, the general process is the same for approximating any function:

1. Translate the target function to accept and return number arrays
2. Gather some input-output pairs of the translated function
3. Follow the procedure of gradient decent

So the first step is to make the function 'accept and return number arrays.' This is because neural nets are build on matrix multiplication and numeric functions; they won't understand other input types. For `xor`, this is super easy:

```javascript
xor([0, 0]) // [0]
xor([0, 1]) // [1]
xor([1, 0]) // [1]
xor([1, 1]) // [0]
```

This representation of `xor` will work for us, but I should stop to point out some of the bad things that happen to functions when they are abused this way. Firstly, the function used to only have four cases because there are only four possible ways to pair up `true` and `false`. Now, some smart-alec (you, later in this intro) could enter a value like `[0.5, 2]` into the function. Similarly, there are now way more possible outputs. Anyhoo, we have completed the first step of the process.

The next thing on the checklist is to 'gather some input-output pairs.' In general, this means taking data and splitting it into two camps: the data we will hand the neural net, and the data we want it to spit out. In the case of `xor`, we want to hand the net two input pseudo-booleans and have it return the correct pseudo-boolean value.

```javascript
// often called 'X'
const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]]

// often called 'Y'
const outputs = [[0], [1], [1], [0]]
```

In less contrived cases, these inputs can represent things like images, audio, weather data, or just about anything else and the outputs can similarly mean just about anything.

Now, we can get to the neural net itself. As discussed earlier, neural nets take in number arrays and spit out number arrays. Using a neural net this way is referred to as running a forward pass. As implied by the name 'forward pass,' neural nets also have a second key feature which is the ability to run a backwards pass:

```typescript
interface NeuralNet {
  passForward(input: number[]): number[]
  passBack(error: number[]): void
}
```

We'll talk about what happens in the backwards pass a bit later when investigating gradient decent, which is where all the magic happens. For now, let's talk about what happens in the forward pass. In vanilla neural nets, the forward pass essentially repeatedly multiplies the input by a matrix and maps the result to some new result.

```typescript
const input: number[] = {
  /*Some Input*/
}

const hidden: number[] = rowMulMat(input, someMatrix).map(someFunction)

const output: number[] = rowMulMat(input, someMatrix).map(someFunction)

return output
```

At an intuitive level, the matrix multiplication is there to mix the input values together. Even our simple `xor` problem can't be solved by only considering one input; at some point, the neural net will need to combine the values. Matrix multiplication is great for mixing numbers up this way. In fact, it's a little _too_ good, but that's a discussion for another time.

The other piece of the puzzle is that mysterious map call. It turns out that if you multiply a matrix by a bunch of matrices in a row, it's effectively the same as multiplying by one, very well chosen matrix. This is cool and all, but not all problems can be modelled by matrix multiplication because not all problems are 'linear' (that's 'linear' in the sense of linear algebra). So, we have to break the linearity of the matrix multiplications by applying non-linear functions to the intermediate values. These functions are called activation functions, and can really be any function that isn't of the form `f` where:

```typescript
const c: number = (/*Some Number*/)
const f = (x: number) => c * x
```
