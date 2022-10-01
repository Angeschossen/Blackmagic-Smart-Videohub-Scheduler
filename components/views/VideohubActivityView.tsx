import * as React from 'react';
import { ActivityItem, Icon, Label, Link, mergeStyleSets, Stack, Text } from '@fluentui/react';
import { VideohubActivity } from '../interfaces/Videohub';
import Router from 'next/router';
import { videohubPageStyle } from '../videohub/VideohubPage';

const classNames = mergeStyleSets({
  exampleRoot: {
    marginTop: '20px',
  },
  nameText: {
    fontWeight: '500',
  },
});

export const VideohubActivityView = (p: { activityItems: VideohubActivity[] }) => {
  return (
    <Stack style={videohubPageStyle}>
      <h1>Recent Activity of Videohubs</h1>
      <Stack>
      {p.activityItems.map((item, _key) => (
        <ActivityItem activityIcon={<Icon iconName={item.icon} />} timeStamp={item.time.toLocaleDateString() + " " + item.time.toLocaleTimeString()} 
        comments={[
          <Link
            onClick={(event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>) => {
              Router.push({
                pathname: '../videohub/main',
                query: { videohub: item.videohub_id },
              });
            }}
          >{item.title}</Link>,
        ]} activityDescription={[<Text className={classNames.nameText}>{item.description}</Text>]} key={item.id} className={classNames.exampleRoot} />
      ))}
      </Stack>
    </Stack>
  );
};
