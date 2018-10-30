# Combobulate

A deployable, lightweight neural net implementation for all JS runtimes.

## TODO

- Dropout (& SNN compliant dropout)
- SNN Compliant activations
- TCN testing
- Boolean function scale-up testing
- Serialization and hydration testing
- Predictor mode
- Finish up the `README` info

## Getting Started With Neural Nets

This is a brief introduction to the anatomy of a neural net.

Neural nets are objects which approximate a target function `f` via a process called gradient decent. I hope this little intro serves as a practical intro to neural nets for ~~dummies~~ engineers like myself; I won't be using any ancient alphabets or college level math in this explanation. As a contrived example, we'll consider the `xor` function:

```javascript
xor(false, false) // false
xor(false, true) // true
xor(true, false) // true
xor(true, true) // false
```

The `xor` function takes two booleans and returns a boolean. Simple enough. There is absolutely no reason to ever use a neural net to approximate `xor`, but we're going to do it anyway.

So the first step is to make the function accept and return number arrays. This is because neural nets operate on number arrays. They won't understand other input types. For `xor`, this is straightforward:

```javascript
xor([0, 0]) // [0]
xor([0, 1]) // [1]
xor([1, 0]) // [1]
xor([1, 1]) // [0]
```

This representation of `xor` will work for us, but I should stop to point out some of the bad things that happen to functions when they are abused this way. Firstly, the function used to only have four cases because there are only four possible ways to pair up `true` and `false`. Now, some smart-alec (you, later in this intro) could enter a value like `[0.5, 2]` into the function. Similarly, there are now infinite possible outputs.

The next thing on the checklist is to gather some input-output pairs. In general, this means taking data and splitting it into two camps: the data we will hand the neural net, and the data we want it to spit out. In the case of `xor`, we want to hand the net two input pseudo-booleans and have it return the correct pseudo-boolean value.

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

We'll talk about what happens in the backwards pass a bit later when investigating gradient decent. For now, let's talk about what happens in the forward pass. In vanilla neural nets, the forward pass essentially repeatedly multiplies the input by a matrix and maps the result to some new result.

```typescript
const input: number[] = [
  /*Some Input*/
]

const hidden: number[] = rowMulMat(input, someMatrixA).map(someFunction)

const output: number[] = rowMulMat(input, someMatrixB).map(someFunction)

return output
```

At an intuitive level, the matrix multiplication is there to mix the input values together. Even our simple `xor` problem can't be solved by considering each input independently; at some point, the neural net will need to combine the values. Matrix multiplication is great for mixing numbers up this way. In fact, it's a little _too_ good, but that's a discussion for another time.

The other piece of the puzzle is that mysterious map call. It turns out that multiplying inputs by a bunch of matrices is an equivalent operation to multiplying inputs by just one matrix. So, without the mysterious mapping calls, neural nets are equivalent to matrix multiplication. That's cool and all, but not all problems can be modelled by matrix multiplication because not all problems are 'linear' (that's 'linear' in the sense of linear algebra). So, we have to break the linearity of the matrix multiplications. We do that by applying non-linear functions to the intermediate values between multiplications. These functions are called activation functions, and can really be any function that isn't of the form `f` where:

```typescript
const c: number = (/*Some Number*/)
const f = (x: number) => c * x
```

In fact, a common one is `relu` which stands for rectified linear unit:

```typescript
function relu(x: number) {
  if (x > 0) {
    return x
  } else {
    return 0
  }
}
```

So in the end, the forward pass is just applying a set series of transformations to the input data. For brevity's sake, let's just call each transformation `Tn` and ignore what kind of transformation it might be:

```typescript
const input: number[] = [/*Some Input*/]

const output = T6(T5(T4(T3(T2(T1(input)))))
```

So as you've just discovered, neural nets up to this point are really boring. Now it's time for the magic! Well, almost- first, it's time for gradient decent.

#### Gradient Decent

Gradient decent is intuitively simple and also a bit confusing when formalized. The basic idea is that if you have a numeric function `f`, you can figure out what `x` to give the function to produce a desired `y` value through guess and check. Let's set up an example problem:

```typescript
// The value we want f to return
const y = 0

function f(x: number){
  return 1 - 0.5 * x
}

// The value gradient decent will help us find
let x = /* ??? */
```

So in this contrived example, it's trivial to see that when `x` is `2`, then `f` will return `0`. However, let's pretend we don't know what's in `f`. Instead, let's say we only know the slope of `f` at a given `x`. Let's call this function `df`. If you recall calculus, note that this is `f'`.

```typescript
import { f, df } from 'narnia'

// The value we want f to return
const y = 0

// The value gradient decent will help us find
let x = /* ??? */
```

So all we can possibly do with these pieces is start guessing `x` values. Let's start with `0`:

```typescript
f(0) // 1
df(0) // -0.5
```

So we didn't get lucky and guess the right answer. However, we know two things: the value we got out of `f` is too big and as `x` increases from `0`, the value returned from `f` should get smaller. It follows that we should try a bigger value of `x`. Let's try `5`:

```typescript
f(5) // -1.5
df(5) // -0.5
```

So the output should still decrease as `x` increases, but now the output is too small. We overshot. How do we avoid overshooting? In general, it's handy to calculate the difference between your desired output and the actual output. This measures how wrong the output was. In our case, the difference is positive `1.5`. Further, we know the slope at `5` is `-0.5`. So, we should adjust our guess by something like `1.5 / -0.5`, which is `-3`. Our new guess is therefore `5 - 3`, which is `2`. Voila:

```typescript
f(2) // 0
df(2) // -0.5
```

It get the right answer.

#### Backward Pass

So what does this have to do with neural nets? It's not like we can change the inputs to the neural net and treat the net as `f` in gradient decent; that would alter the function your neural net is trying to approximate. However, remember that neural nets aren't just one function. They are a whole bunch of functions applied to the input in order:

```typescript
const input: number[] = [/*Some Input*/]

const output = T6(T5(T4(T3(T2(T1(input)))))
```

The output of the net is the output of `T6`, so to get better answers out of the neural net all we have to do is give better inputs to `T6`. Using the differences between the
