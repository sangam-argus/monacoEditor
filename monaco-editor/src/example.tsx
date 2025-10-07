// example.tsx

import React from 'react';

interface GreetingProps {
  name: string;
}

const Greeting: React.FC<GreetingProps> = ({ name }) => {
  return <h1>Hello, {name}!</h1>;
};

const Example: React.FC = () => {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <Greeting name="World" />
      <p>You clicked {count} times</p>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};

export default Example;